document.addEventListener('DOMContentLoaded', function() {
    // Get all category links
    const categoryLinks = document.querySelectorAll('.list-group-item');
    const menuItems = document.querySelectorAll('.menu-item');

    // Add click event listeners to category links
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            categoryLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            const selectedCategory = this.dataset.category;
            
            // Show/hide menu items based on category
            menuItems.forEach(item => {
                if (selectedCategory === 'all' || item.dataset.category === selectedCategory) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });

    // Add to cart functionality
    const cartButtons = document.querySelectorAll('.add-to-cart');
    cartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.dataset.itemId;
            // TODO: Implement cart functionality
            alert('Added to cart! (To be implemented)');
        });
    });
}); 