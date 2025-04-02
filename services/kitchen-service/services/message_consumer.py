import pika
import json
import os
import logging
import threading
from typing import Dict, Any, List, Callable
import time
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OrderConsumer:
    """
    Class to handle consuming order messages from RabbitMQ
    """
    
    def __init__(self):
        """
        Initialize the RabbitMQ consumer for orders
        """
        self.connection = None
        self.channel = None
        self.is_connected = False
        self.consumer_thread = None
        self.is_running = False
        
        # In-memory storage for active orders
        self.active_orders = {}  # order_id -> order_data
        
        # Callback registry for order events
        self.order_created_callbacks = []
        self.order_updated_callbacks = []
        
        # RabbitMQ connection details
        self.rabbitmq_url = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
        
        # Exchange and queue names (must match publisher)
        self.order_exchange = "order_events"
        self.order_created_queue = "order_created"
        self.order_updated_queue = "order_updated"

    def register_order_created_callback(self, callback: Callable[[Dict[str, Any]], None]):
        """
        Register a callback to be called when a new order is created
        """
        self.order_created_callbacks.append(callback)
        
    def register_order_updated_callback(self, callback: Callable[[Dict[str, Any]], None]):
        """
        Register a callback to be called when an order is updated
        """
        self.order_updated_callbacks.append(callback)

    def connect(self):
        """
        Connect to RabbitMQ
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
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {str(e)}")
            self.is_connected = False
            return False
    
    def start_consuming(self):
        """
        Start consuming messages in a separate thread
        """
        if self.is_running:
            logger.warning("Consumer is already running")
            return
        
        def consumer_thread_function():
            reconnect_delay = 5  # seconds
            
            while self.is_running:
                try:
                    if not self.is_connected:
                        if not self.connect():
                            logger.warning(f"Failed to connect to RabbitMQ, retrying in {reconnect_delay} seconds")
                            time.sleep(reconnect_delay)
                            continue
                    
                    # Set up consumers for each queue
                    self.channel.basic_consume(
                        queue=self.order_created_queue,
                        on_message_callback=self.on_order_created,
                        auto_ack=False
                    )
                    
                    self.channel.basic_consume(
                        queue=self.order_updated_queue,
                        on_message_callback=self.on_order_updated,
                        auto_ack=False
                    )
                    
                    # Start consuming (this is a blocking call)
                    logger.info("Starting to consume order messages...")
                    self.channel.start_consuming()
                    
                except Exception as e:
                    logger.error(f"Error in consumer thread: {str(e)}")
                    self.is_connected = False
                    
                    # Sleep before reconnecting
                    time.sleep(reconnect_delay)
        
        # Start the consumer thread
        self.is_running = True
        self.consumer_thread = threading.Thread(target=consumer_thread_function)
        self.consumer_thread.daemon = True  # Thread will exit when main thread exits
        self.consumer_thread.start()
        logger.info("Order message consumer thread started")
    
    def stop_consuming(self):
        """
        Stop consuming messages
        """
        self.is_running = False
        
        if self.channel and self.channel.is_open:
            self.channel.stop_consuming()
        
        if self.connection and self.connection.is_open:
            self.connection.close()
        
        logger.info("Order message consumer stopped")
    
    # Message handler callbacks
    
    def on_order_created(self, ch, method, properties, body):
        """
        Handle order_created event
        """
        try:
            message = json.loads(body)
            logger.info(f"Received order_created event: {message}")
            
            if "data" in message and isinstance(message["data"], dict):
                order_data = message["data"]
                order_id = order_data.get("order_id")
                
                if order_id:
                    # Store the order in our active orders
                    self.active_orders[order_id] = order_data
                    
                    # Call all registered callbacks
                    for callback in self.order_created_callbacks:
                        try:
                            callback(order_data)
                        except Exception as e:
                            logger.error(f"Error in order_created callback: {str(e)}")
            
            # Acknowledge the message
            ch.basic_ack(delivery_tag=method.delivery_tag)
            
        except Exception as e:
            logger.error(f"Error processing order_created event: {str(e)}")
            # Negative acknowledgment to requeue the message
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
    
    def on_order_updated(self, ch, method, properties, body):
        """
        Handle order_updated event
        """
        try:
            message = json.loads(body)
            logger.info(f"Received order_updated event: {message}")
            
            if "data" in message and isinstance(message["data"], dict):
                update_data = message["data"]
                order_id = update_data.get("order_id")
                new_status = update_data.get("new_status")
                
                if order_id and new_status:
                    # Update the order in our active orders if we have it
                    if order_id in self.active_orders:
                        self.active_orders[order_id]["order_status"] = new_status
                    
                    # Call all registered callbacks
                    for callback in self.order_updated_callbacks:
                        try:
                            callback(update_data)
                        except Exception as e:
                            logger.error(f"Error in order_updated callback: {str(e)}")
            
            # Acknowledge the message
            ch.basic_ack(delivery_tag=method.delivery_tag)
            
        except Exception as e:
            logger.error(f"Error processing order_updated event: {str(e)}")
            # Negative acknowledgment to requeue the message
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
    
    # Methods for accessing orders
    
    def get_active_orders(self, table_id: int = None) -> List[Dict[str, Any]]:
        """
        Get all active orders, optionally filtered by table
        """
        orders = list(self.active_orders.values())
        
        if table_id is not None:
            orders = [order for order in orders if order.get("table_id") == table_id]
            
        return orders
    
    def get_order(self, order_id: int) -> Dict[str, Any]:
        """
        Get a specific order by ID
        """
        return self.active_orders.get(order_id)

# Create a singleton instance
consumer = OrderConsumer()

# Start consuming messages at import time
consumer.start_consuming() 