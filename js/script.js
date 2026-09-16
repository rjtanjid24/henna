// Product Configuration
const products = {
    p1: { regular: 110, wholesale: 70 },
    p2: { regular: 120, wholesale: 70 },
    p3: { regular: 100, wholesale: 70 }
};

const MIN_ORDER = 2;
const WHOLESALE_QTY = 15;

// Toggle Mobile Menu
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('active');
}

// Order Calculation Logic
function calcTotal() {
    let totalQty = 0;
    let subTotal = 0;
    let activeItems = [];

    ['p1', 'p2', 'p3'].forEach(id => {
        const checkbox = document.getElementById(id + '-check');
        const qtyInput = document.getElementById('qty-' + id);
        
        if (checkbox.checked) {
            qtyInput.disabled = false;
            let qty = parseInt(qtyInput.value) || 0;
            if(qty < 1) { qty = 1; qtyInput.value = 1; }
            totalQty += qty;
            activeItems.push({ id: id, qty: qty });
        } else {
            qtyInput.disabled = true;
            qtyInput.value = 1; 
        }
    });

    // Wholesale Check
    let isWholesale = totalQty >= WHOLESALE_QTY;
    document.getElementById('wholesale-msg').style.display = isWholesale ? 'block' : 'none';

    // Price Calculation
    activeItems.forEach(item => {
        let price = isWholesale ? products[item.id].wholesale : products[item.id].regular;
        subTotal += (price * item.qty);
        document.getElementById('price-' + item.id).innerText = price;
        let badge = document.getElementById('badge-' + item.id);
        if(isWholesale) badge.style.display = 'inline-block';
        else badge.style.display = 'none';
    });

    // Reset prices if not wholesale
    if(!isWholesale) {
        ['p1', 'p2', 'p3'].forEach(id => {
            document.getElementById('price-' + id).innerText = products[id].regular;
            document.getElementById('badge-' + id).style.display = 'none';
        });
    }

    // Delivery Cost
    let deliveryCost = 0;
    const locationRadios = document.getElementsByName('location');
    for(let radio of locationRadios) {
        if(radio.checked) {
            deliveryCost = parseInt(radio.value);
            document.getElementById('loc-in').classList.remove('active');
            document.getElementById('loc-out').classList.remove('active');
            radio.parentElement.classList.add('active');
        }
    }

    // Final Update
    document.getElementById('subtotal').innerText = subTotal;
    document.getElementById('delivery-cost').innerText = deliveryCost;
    document.getElementById('grand-total').innerText = subTotal + deliveryCost;

    // Validation (Min Order)
    const submitBtn = document.getElementById('submit-btn');
    const minMsg = document.getElementById('min-order-msg');

    if (totalQty > 0 && totalQty < MIN_ORDER) {
        minMsg.style.display = 'block';
        submitBtn.disabled = true;
    } else if (totalQty === 0) {
        minMsg.style.display = 'none';
        submitBtn.disabled = true; 
    } else {
        minMsg.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Order Submission via WhatsApp
function submitOrder(e) {
    e.preventDefault();

    // VALIDATION: Delivery Area Check
    const locationChecked = document.querySelector('input[name="location"]:checked');
    if (!locationChecked) {
        alert('দয়া করে ডেলিভারি এরিয়া সিলেক্ট করুন!');
        document.querySelector('.delivery-row').scrollIntoView({ behavior: 'smooth' });
        return;
    }

    // Get Input Values by ID
    let name = document.getElementById('c-name').value;
    let phone = document.getElementById('c-phone').value;
    let address = document.getElementById('c-address').value;
    let trx = document.getElementById('c-trx').value;
    let note = document.getElementById('c-note').value;
    
    // Payment Method
    let paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    let paymentText = (paymentMethod === 'cod') ? 'ক্যাশ অন ডেলিভারি' : 'বিকাশ (সেন্ড মানি)';

    // VALIDATION: bKash TrxID Check
    if (paymentMethod === 'bkash' && (!trx || trx.trim() === '')) {
        alert('বিকাশ পেমেন্টের জন্য Transaction ID বাধ্যতামূলক!');
        document.getElementById('c-trx').focus();
        document.getElementById('c-trx').style.border = "1px solid red";
        return;
    } else {
        document.getElementById('c-trx').style.border = "1px solid #ddd";
    }

    // Product Details String
    let productDetails = "";
    ['p1', 'p2', 'p3'].forEach(id => {
        let checkbox = document.getElementById(id + '-check');
        if(checkbox.checked) {
            let pName = document.querySelector(`label[for="${id}-check"] strong`).innerText;
            let pSize = document.querySelector(`label[for="${id}-check"] small`).innerText;
            let qty = document.getElementById('qty-' + id).value;
            let price = document.getElementById('price-' + id).innerText;
            productDetails += `▪️ ${pName} (${pSize}) - ${qty} pc(s) x ${price}tk\n`;
        }
    });

    // Totals
    let subtotal = document.getElementById('subtotal').innerText;
    let delivery = document.getElementById('delivery-cost').innerText;
    let total = document.getElementById('grand-total').innerText;

    // WhatsApp Message Format
    let message = `*New Order* \n-----------------------------\n *নাম:* ${name}\n *ফোন:* ${phone}\n *ঠিকানা:* ${address}\n *TrxID:* ${trx ? trx : 'N/A'}\n *নোট:* ${note ? note : 'নেই'}\n-----------------------------\n *অর্ডার ডিটেইলস:*\n${productDetails}-----------------------------\n সাব-টোটাল: ${subtotal}\n ডেলিভারি চার্জ: ${delivery}\n *সর্বমোট বিল:* ${total}\n পেমেন্ট: ${paymentText}\n-----------------------------`;

    // Send to WhatsApp
    let myNumber = "8801330975378"; 
    let url = "https://wa.me/" + myNumber + "?text=" + encodeURIComponent(message);
    window.open(url, '_blank').focus();
}

// Payment UI & Modal Logic
function updatePaymentUI(selectedPayment) {
    document.getElementById('pay-cod').classList.remove('active');
    document.getElementById('pay-bkash').classList.remove('active');
    document.getElementById('pay-' + selectedPayment).classList.add('active');

    // TrxID Placeholder update logic
    const trxInput = document.getElementById('c-trx');
    if (selectedPayment === 'bkash') {
        trxInput.placeholder = "বিকাশ পেমেন্টের TrxID লিখুন (বাধ্যতামূলক)";
        
        // Check if products selected
        let currentTotal = document.getElementById('grand-total').innerText;
        if(currentTotal == '0') {
            alert('দয়া করে আগে প্রোডাক্ট সিলেক্ট করুন!');
            document.getElementById('pay-cod').click(); 
            return;
        }
        showBkashPopup();
    } else {
        trxInput.placeholder = "ঐচ্ছিক (যদি অ্যাডভান্স করে থাকেন)";
    }
}

function showBkashPopup() {
    let currentTotal = document.getElementById('grand-total').innerText;
    document.getElementById('modal-total-amount').innerText = currentTotal;
    document.getElementById('bkashModal').style.display = 'flex';
}

function closeBkashPopup() {
    document.getElementById('bkashModal').style.display = 'none';
}

function copyBkashNumber() {
    var numberText = document.getElementById("bkash-number-text").innerText;
    navigator.clipboard.writeText(numberText).then(function() {
        var msgBox = document.getElementById("copy-success-msg");
        msgBox.style.display = "block";
        setTimeout(function() { msgBox.style.display = "none"; }, 2000);
    });
}

// Close modal on outside click
window.onclick = function(event) {
    let modal = document.getElementById('bkashModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
