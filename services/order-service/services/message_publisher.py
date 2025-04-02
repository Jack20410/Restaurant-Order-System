import pika
import json
import os
import logging
from typing import Dict, Any
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OrderPublisher:
    """
    Class to handle publishing order events to RabbitMQ
    """
    
    def __init__(self):
        """
        Initialize the RabbitMQ connection and channel
        """
        self.connection = None
        self.channel = None
        self.is_connected = False
        self.rabbitmq_url = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
        
        # Exchange and queue names
        self.order_exchange = "order_events"
        self.order_created_queue = "order_created"
        self.order_updated_queue = "order_updated"
        
        # Try to connect to RabbitMQ
        self.connect()
    
    def connect(self):
        """
        Connect to RabbitMQ and set up exchanges and queues
        """
        try:
            # Create a connection
            parameters = pika.URLParameters(self.rabbitmq_url)
            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()
            
            # Declare exchange - using 'fanout' to broadcast to all queues
            self.channel.exchange_declare(
                exchange=self.order_exchange, 
                exchange_type='fanout',
                durable=True
            )
            
            # Declare queues
            self.channel.queue_declare(queue=self.order_created_queue, durable=True)
            self.channel.queue_declare(queue=self.order_updated_queue, durable=True)
            
            # Bind queues to the exchange
            self.channel.queue_bind(
                exchange=self.order_exchange,
                queue=self.order_created_queue
            )
            self.channel.queue_bind(
                exchange=self.order_exchange,
                queue=self.order_updated_queue
            )
            
            self.is_connected = True
            logger.info("Successfully connected to RabbitMQ")
            
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {str(e)}")
            self.is_connected = False
    
    def publish_message(self, message: Dict[str, Any], routing_key: str):
        """
        Publish a message to a specific queue
        """
        if not self.is_connected:
            logger.warning("Not connected to RabbitMQ, attempting to reconnect...")
            self.connect()
            if not self.is_connected:
                logger.error("Failed to reconnect to RabbitMQ, message not sent")
                return False
        
        try:
            # Convert message to JSON string
            message_body = json.dumps(message)
            
            # Publish message to the exchange with the routing key
            self.channel.basic_publish(
                exchange=self.order_exchange,
                routing_key=routing_key,
                body=message_body,
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                    content_type='application/json'
                )
            )
            logger.info(f"Published message to {routing_key}: {message}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to publish message: {str(e)}")
            self.is_connected = False
            return False
    
    def publish_order_created(self, order_data: Dict[str, Any]):
        """
        Publish a message when a new order is created
        """
        message = {
            "event_type": "order_created",
            "data": order_data,
            "timestamp": str(datetime.now())
        }
        return self.publish_message(message, self.order_created_queue)
    
    def publish_order_updated(self, order_id: int, status: str, updated_by: str):
        """
        Publish a message when an order status is updated
        """
        message = {
            "event_type": "order_updated",
            "data": {
                "order_id": order_id,
                "new_status": status,
                "updated_by": updated_by
            },
            "timestamp": str(datetime.now())
        }
        return self.publish_message(message, self.order_updated_queue)
    
    def close(self):
        """
        Close the connection to RabbitMQ
        """
        if self.connection and self.connection.is_open:
            self.connection.close()
            self.is_connected = False
            logger.info("RabbitMQ connection closed")

# Create a singleton instance
publisher = OrderPublisher() 