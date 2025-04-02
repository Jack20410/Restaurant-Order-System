import pika
import json
import os
import logging
import threading
from typing import Dict, Any, Callable, List
import time

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MessageConsumer:
    """
    Class to handle consuming messages from RabbitMQ
    """
    
    def __init__(self):
        """
        Initialize the RabbitMQ consumer
        """
        self.connection = None
        self.channel = None
        self.is_connected = False
        self.consumer_thread = None
        self.is_running = False
        self.menu_cache = {}  # Local cache for menu items
        
        # RabbitMQ connection details
        self.rabbitmq_url = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
        
        # Exchange and queue names (must match publisher)
        self.menu_exchange = "menu_events"
        self.menu_updated_queue = "menu_updated"
        self.menu_item_added_queue = "menu_item_added"
        self.menu_item_status_changed_queue = "menu_item_status_changed"

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
                exchange=self.menu_exchange, 
                exchange_type='fanout',
                durable=True
            )
            
            # Declare queues
            self.channel.queue_declare(queue=self.menu_updated_queue, durable=True)
            self.channel.queue_declare(queue=self.menu_item_added_queue, durable=True)
            self.channel.queue_declare(queue=self.menu_item_status_changed_queue, durable=True)
            
            # Bind queues to the exchange
            self.channel.queue_bind(
                exchange=self.menu_exchange,
                queue=self.menu_updated_queue
            )
            self.channel.queue_bind(
                exchange=self.menu_exchange,
                queue=self.menu_item_added_queue
            )
            self.channel.queue_bind(
                exchange=self.menu_exchange,
                queue=self.menu_item_status_changed_queue
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
                        queue=self.menu_updated_queue,
                        on_message_callback=self.on_menu_updated,
                        auto_ack=False
                    )
                    
                    self.channel.basic_consume(
                        queue=self.menu_item_added_queue,
                        on_message_callback=self.on_menu_item_added,
                        auto_ack=False
                    )
                    
                    self.channel.basic_consume(
                        queue=self.menu_item_status_changed_queue,
                        on_message_callback=self.on_menu_item_status_changed,
                        auto_ack=False
                    )
                    
                    # Start consuming (this is a blocking call)
                    logger.info("Starting to consume messages...")
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
        logger.info("Message consumer thread started")
    
    def stop_consuming(self):
        """
        Stop consuming messages
        """
        self.is_running = False
        
        if self.channel and self.channel.is_open:
            self.channel.stop_consuming()
        
        if self.connection and self.connection.is_open:
            self.connection.close()
        
        logger.info("Message consumer stopped")
    
    # Message handler callbacks
    
    def on_menu_updated(self, ch, method, properties, body):
        """
        Handle menu_updated event
        """
        try:
            message = json.loads(body)
            logger.info(f"Received menu_updated event: {message}")
            
            # Update the entire menu cache
            if "data" in message and isinstance(message["data"], list):
                new_cache = {}
                for item in message["data"]:
                    if "food_id" in item:
                        new_cache[item["food_id"]] = item
                
                self.menu_cache = new_cache
                logger.info(f"Menu cache updated with {len(self.menu_cache)} items")
            
            # Acknowledge the message
            ch.basic_ack(delivery_tag=method.delivery_tag)
            
        except Exception as e:
            logger.error(f"Error processing menu_updated event: {str(e)}")
            # Negative acknowledgment to requeue the message
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
    
    def on_menu_item_added(self, ch, method, properties, body):
        """
        Handle menu_item_added event
        """
        try:
            message = json.loads(body)
            logger.info(f"Received menu_item_added event: {message}")
            
            # Add item to cache
            if "data" in message and isinstance(message["data"], dict) and "food_id" in message["data"]:
                self.menu_cache[message["data"]["food_id"]] = message["data"]
                logger.info(f"Added item {message['data']['food_id']} to menu cache")
            
            # Acknowledge the message
            ch.basic_ack(delivery_tag=method.delivery_tag)
            
        except Exception as e:
            logger.error(f"Error processing menu_item_added event: {str(e)}")
            # Negative acknowledgment to requeue the message
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
    
    def on_menu_item_status_changed(self, ch, method, properties, body):
        """
        Handle menu_item_status_changed event
        """
        try:
            message = json.loads(body)
            logger.info(f"Received menu_item_status_changed event: {message}")
            
            # Update item in cache
            if "data" in message and isinstance(message["data"], dict) and "item_id" in message["data"]:
                item_id = message["data"]["item_id"]
                new_status = message["data"]["new_status"]
                
                if item_id in self.menu_cache:
                    self.menu_cache[item_id]["availability"] = new_status
                    logger.info(f"Updated status of item {item_id} to {new_status} in menu cache")
            
            # Acknowledge the message
            ch.basic_ack(delivery_tag=method.delivery_tag)
            
        except Exception as e:
            logger.error(f"Error processing menu_item_status_changed event: {str(e)}")
            # Negative acknowledgment to requeue the message
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
    
    # Methods for accessing the cache
    
    def get_menu(self) -> List[Dict[str, Any]]:
        """
        Get all menu items from the cache
        """
        return list(self.menu_cache.values())
    
    def get_food_item(self, food_id: str) -> Dict[str, Any]:
        """
        Get a specific food item from the cache
        """
        return self.menu_cache.get(food_id)
    
    def check_food_availability(self, food_ids: List[str]) -> Dict[str, bool]:
        """
        Check if multiple food items are available in the cache
        """
        availability = {}
        
        for food_id in food_ids:
            if food_id in self.menu_cache and self.menu_cache[food_id].get("availability") == "available":
                availability[food_id] = True
            else:
                availability[food_id] = False
        
        return availability

# Create a singleton instance
consumer = MessageConsumer()

# Start consuming messages at import time
consumer.start_consuming() 