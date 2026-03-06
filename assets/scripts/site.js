
        // Hardcoded product data for Homestay
        var products = [
            {
                name: "Double Bedroom (Non-AC)",
                tamilName: "இரட்டை படுக்கையறை",
                weight: "Max 2 Adults",
                price: "₹1200.00",
                category: "rooms"
            }
        ];
        
        var cart = {}; // Object to store selected items
        var currentCategory = "all"; // Track current category
        var userLocation = null; // Store user's location

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            renderProducts();
            
            // Set default date to today
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('checkin-date').value = today;
        });

        // Function to render products
        function renderProducts() {
            const searchTerm = document.getElementById('search-product').value.toLowerCase();
            const tableBody = document.getElementById("product-table-body");
            tableBody.innerHTML = "";
            
            const filteredProducts = products.filter(product => {
                const matchesCategory = currentCategory === "all" || product.category === currentCategory;
                const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                                      (product.tamilName && product.tamilName.toLowerCase().includes(searchTerm));
                return matchesCategory && matchesSearch;
            });
            
            filteredProducts.forEach(product => {
                // Check if product is already in cart
                const isChecked = cart[product.name] ? 'checked' : '';
                const qty = cart[product.name] ? cart[product.name].quantity : 1;
                
                const row = document.createElement("tr");
                // Store product data in dataset for easy retrieval
                row.dataset.name = product.name;
                row.dataset.price = product.price;
                row.dataset.weight = product.weight;
                
                row.innerHTML = `
                    <td class="product-select">
                        <input type="checkbox" class="product-checkbox" ${isChecked}>
                    </td>
                    <td>
                        <div class="product-name">${product.name} (${product.weight})</div>
                        <div class="tamil-name">${product.tamilName} (${product.weight})</div>
                    </td>
                    <td class="product-price">${product.price}</td>
                    <td class="product-qty">
                        <input type="number" class="qty-input" value="${qty}" min="1">
                    </td>
                `;
                tableBody.appendChild(row);
            });
            updateSummary();
        }
        
        // Search Event Listener
        document.getElementById('search-product').addEventListener('input', renderProducts);
        
        // Days input listener
        document.getElementById('num-days').addEventListener('input', updateSummary);
        
        // Handle Print PDF
        document.getElementById('print-pdf-btn').addEventListener('click', function() {
            if (!products || products.length === 0) {
                alert("Product data is loading. Please try again in a moment.");
                return;
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Header
            doc.setFontSize(18);
            doc.setTextColor(230, 81, 0);
            doc.text("HOME STAY AT KUMBAKONAM", 105, 15, { align: "center" });
            
            doc.setFontSize(12);
            doc.setTextColor(51, 51, 51);
            doc.text("Tariff Details", 105, 22, { align: "center" });
            doc.setFontSize(10);
            doc.text("Contact: +91 99406 81795", 105, 28, { align: "center" });
            
            // Table Data
            const tableBody = products.map((p, index) => [
                index + 1,
                p.name,
                p.weight,
                p.price
            ]);
            
            doc.autoTable({
                head: [['S.No', 'Room Type', 'Capacity', 'Tariff']],
                body: tableBody,
                startY: 35,
                theme: 'striped',
                headStyles: { fillColor: [230, 81, 0] },
                styles: { fontSize: 10 },
                alternateRowStyles: { fillColor: [255, 245, 245] }
            });
            
            doc.save("Kumbakonam_Homestay_Tariff.pdf");
        });
        
        // Event delegation for table interactions (checkbox and quantity)
        document.getElementById('product-table-body').addEventListener('change', function(e) {
            const target = e.target;
            const row = target.closest('tr');
            if (!row) return;
            
            const name = row.dataset.name;
            const price = row.dataset.price;
            const weight = row.dataset.weight;
            const checkbox = row.querySelector('.product-checkbox');
            const qtyInput = row.querySelector('.qty-input');
            
            if (target.classList.contains('product-checkbox') || target.classList.contains('qty-input')) {
                if (checkbox.checked) {
                    cart[name] = {
                        quantity: qtyInput.value,
                        price: price,
                        weight: weight
                    };
                } else {
                    delete cart[name];
                }
            }
            updateSummary();
        });

        // Helper to parse price string (e.g., "₹116.00" -> 116.00)
        function parsePrice(priceStr) {
            return parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
        }

        // Function to update live summary
        function updateSummary() {
            let totalQty = 0;
            let totalCost = 0;
            const numDays = parseInt(document.getElementById('num-days').value) || 1;
            
            for (let key in cart) {
                const item = cart[key];
                const qty = parseInt(item.quantity) || 0;
                const price = parsePrice(item.price);
                
                totalQty += qty;
                totalCost += (qty * price * numDays);
            }
            
            document.getElementById('summary-count').textContent = totalQty;
            document.getElementById('summary-cost').textContent = '₹' + totalCost.toFixed(2);
            
            // Show summary if items exist
            const summaryDiv = document.getElementById('live-summary');
            if (totalQty > 0) {
                summaryDiv.style.display = 'block';
            } else {
                summaryDiv.style.display = 'none';
            }
        }

        // ============ LOCATION CAPTURE FUNCTIONALITY ============
        
        // Show/hide location button when checkbox is toggled
        document.getElementById('share-location').addEventListener('change', function() {
            const getLocationBtn = document.getElementById('get-location-btn');
            const locationStatus = document.getElementById('location-status');
            
            if (this.checked) {
                getLocationBtn.style.display = 'inline-block';
                locationStatus.innerHTML = '<i class="fas fa-info-circle"></i> Click the button below to share your location';
                locationStatus.className = 'loading';
            } else {
                getLocationBtn.style.display = 'none';
                locationStatus.innerHTML = '';
                locationStatus.className = '';
                userLocation = null;
                document.getElementById('latitude').value = '';
                document.getElementById('longitude').value = '';
                document.getElementById('location-address').value = '';
            }
        });
        
        // Get location when button is clicked
        document.getElementById('get-location-btn').addEventListener('click', function() {
            const locationStatus = document.getElementById('location-status');
            
            if (!navigator.geolocation) {
                locationStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Geolocation is not supported by your browser';
                locationStatus.className = 'error';
                return;
            }
            
            locationStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting your location...';
            locationStatus.className = 'loading';
            
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    // Store location
                    userLocation = { lat, lng };
                    document.getElementById('latitude').value = lat;
                    document.getElementById('longitude').value = lng;
                    
                    // Get address from coordinates (reverse geocoding)
                    getAddressFromCoords(lat, lng);
                    
                    locationStatus.innerHTML = `<i class="fas fa-check-circle"></i> Location captured successfully!<br>
                        <small>Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}</small><br>
                        <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank" style="color: #1976d2;">
                            <i class="fas fa-map-marker-alt"></i> View on Google Maps
                        </a>`;
                    locationStatus.className = 'success';
                },
                function(error) {
                    let errorMessage = '';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = "Location access denied. Please enable location permissions in your browser.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = "Location information is unavailable.";
                            break;
                        case error.TIMEOUT:
                            errorMessage = "Location request timed out.";
                            break;
                        default:
                            errorMessage = "An unknown error occurred.";
                    }
                    locationStatus.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`;
                    locationStatus.className = 'error';
                }
            );
        });
        
        // Function to get address from coordinates (optional - requires API key for production)
        function getAddressFromCoords(lat, lng) {
            // Using Nominatim (OpenStreetMap) for reverse geocoding - free, no API key needed
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                .then(response => response.json())
                .then(data => {
                    if (data.display_name) {
                        document.getElementById('location-address').value = data.display_name;
                        const locationStatus = document.getElementById('location-status');
                        locationStatus.innerHTML += `<br><small><strong>Address:</strong> ${data.display_name}</small>`;
                    }
                })
                .catch(error => {
                    console.log('Could not fetch address:', error);
                    // Not critical, so we don't show error to user
                });
        }

        // Handle Review Order (Open Modal)
        document.getElementById('review-order-btn').addEventListener('click', function() {
            const name = document.getElementById('customer-name').value.trim();
            const mobile = document.getElementById('customer-mobile').value.trim();
            const address = document.getElementById('customer-address').value.trim();
            const checkinDate = document.getElementById('checkin-date').value;
            const numDays = document.getElementById('num-days').value;
            
            if (!name || !mobile) {
                alert("Please fill in your Name and Mobile Number.");
                return;
            }
            
            const cartItems = Object.keys(cart);
            if (cartItems.length === 0) {
                alert("Please select a room.");
                return;
            }
            
            // Populate Modal
            document.getElementById('preview-name').textContent = name;
            document.getElementById('preview-mobile').textContent = mobile;
            document.getElementById('preview-address').textContent = address || "Not provided";
            document.getElementById('preview-date').textContent = checkinDate;
            document.getElementById('preview-days').textContent = numDays;
            
            const previewItems = document.getElementById('preview-items');
            previewItems.innerHTML = "";
            let totalCost = 0;
            
            cartItems.forEach(itemName => {
                const item = cart[itemName];
                const priceVal = parsePrice(item.price);
                const itemTotal = priceVal * item.quantity * numDays;
                totalCost += itemTotal;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${itemName}</td>
                    <td>${item.quantity}</td>
                    <td>₹${itemTotal.toFixed(2)}</td>
                `;
                previewItems.appendChild(row);
            });
            
            document.getElementById('preview-total-cost').textContent = '₹' + totalCost.toFixed(2);
            
            // Show Modal
            document.getElementById('preview-modal').style.display = "block";
        });

        // Close Modal Logic
        document.querySelector('.close-modal').addEventListener('click', function() {
            document.getElementById('preview-modal').style.display = "none";
        });
        
        window.addEventListener('click', function(event) {
            const modal = document.getElementById('preview-modal');
            if (event.target == modal) {
                modal.style.display = "none";
            }
        });

        // Handle Final WhatsApp Submission
        document.getElementById('confirm-order-btn').addEventListener('click', function() {
            const name = document.getElementById('customer-name').value.trim();
            const mobile = document.getElementById('customer-mobile').value.trim();
            const address = document.getElementById('customer-address').value.trim();
            const checkinDate = document.getElementById('checkin-date').value;
            const numDays = document.getElementById('num-days').value;
            const cartItems = Object.keys(cart);
            
            let message = `*Booking Request - Home Stay at Kumbakonam*\n\n`;
            message += `*Name:* ${name}\n`;
            message += `*Mobile:* ${mobile}\n`;
            message += `*Coming From:* ${address}\n`;
            message += `*Check-in Date:* ${checkinDate}\n`;
            message += `*Duration:* ${numDays} Days\n`;
            
            // Add location if captured
            if (userLocation) {
                const lat = document.getElementById('latitude').value;
                const lng = document.getElementById('longitude').value;
                const locationAddr = document.getElementById('location-address').value;
                
                message += `\n*📍 Location Details:*\n`;
                message += `Coordinates: ${lat}, ${lng}\n`;
                message += `Google Maps: https://maps.google.com/?q=${lat},${lng}\n`;
                if (locationAddr) {
                    message += `Address: ${locationAddr}\n`;
                }
            }
            
            message += `\n*Booking Details:*\n`;
            
            let totalCost = 0;
            cartItems.forEach((itemName, index) => {
                const item = cart[itemName];
                const priceVal = parsePrice(item.price);
                const itemTotal = priceVal * item.quantity * numDays;
                totalCost += itemTotal;
                message += `${index + 1}. ${itemName} - Rooms: ${item.quantity} - ₹${itemTotal.toFixed(2)}\n`;
            });
            
            message += `\n*Total Estimated Cost: ₹${totalCost.toFixed(2)}*`;
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/919940681795?text=${encodedMessage}`;
            
            window.open(whatsappUrl, '_blank');
        });

        // Add event listeners to filter buttons
        document.querySelectorAll(".filter-btn").forEach(button => {
            button.addEventListener("click", function() {
                // Remove active class from all buttons
                document.querySelectorAll(".filter-btn").forEach(btn => {
                    btn.classList.remove("active");
                });
                
                // Add active class to clicked button
                this.classList.add("active");
                
                // Get category and render products
                currentCategory = this.getAttribute("data-category");
                renderProducts();
            });
        });