
let shoppingCartState = [];


function switchCategory(categoryName, clickTarget) {

    document.querySelectorAll('.nav-tabs-custom .nav-link').forEach(btn => btn.classList.remove('active'));
    clickTarget.classList.add('active');

    const headingMap = {
        'pardoz': "Pardozlash va bo'yoq materiallari",
        'santexnika': "Santexnika va quvur jihozlari",
        'elektr': "Elektrika jihozlari",
        'asboblar': "Qo'l mehnat asboblari (Instrumentlar)"
    };
    document.getElementById('current-category-heading').innerText = headingMap[categoryName] || 'Katalog';


    document.querySelectorAll('.category-pane').forEach(pane => pane.classList.remove('active-pane'));
    const targetedPane = document.getElementById(`pane-${categoryName}`);
    if (targetedPane) {
        targetedPane.classList.add('active-pane');
    }
}


const cartManager = {
    add: function(id, name, price) {
        const existingProduct = shoppingCartState.find(item => item.id === id);
        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            shoppingCartState.push({
                id: id,
                name: name,
                price: price,
                quantity: 1
            });
        }
        this.syncDOM();
    },
    
    alterQty: function(id, direction) {
        const targetProduct = shoppingCartState.find(item => item.id === id);
        if (!targetProduct) return;

        if (direction === 'plus') {
            targetProduct.quantity += 1;
        } else if (direction === 'minus') {
            targetProduct.quantity -= 1;
            if (targetProduct.quantity <= 0) {
                shoppingCartState = shoppingCartState.filter(item => item.id !== id);
            }
        }
        this.syncDOM();
    },

    syncDOM: function() {
        const counterElement = document.getElementById('cart-counter');
        const itemsContainer = document.getElementById('cart-items-wrapper');
        const totalSumElement = document.getElementById('cart-total-sum');
        const checkoutBtn = document.getElementById('btn-go-checkout');

        const absoluteCount = shoppingCartState.reduce((acc, current) => acc + current.quantity, 0);
        counterElement.innerText = absoluteCount;

        if (shoppingCartState.length === 0) {
            itemsContainer.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="fa-solid fa-basket-shopping fs-1 d-block mb-3 text-light"></i>
                    Savat bo'sh. Mahsulot qo'shing!
                </div>`;
            totalSumElement.innerText = "0 so'm";
            checkoutBtn.disabled = true;
            return;
        }

        checkoutBtn.disabled = false;
        itemsContainer.innerHTML = '';
        let grandTotalSum = 0;

        shoppingCartState.forEach(product => {
            const combinedPrice = product.price * product.quantity;
            grandTotalSum += combinedPrice;

            itemsContainer.innerHTML += `
                <div class="cart-item-row">
                    <div>
                        <h6 class="fw-bold mb-1 text-dark" style="font-size: 0.95rem;">${product.name}</h6>
                        <span class="text-primary fw-bold small">${product.price.toLocaleString('uz-UZ')} so'm</span>
                    </div>
                    <div class="qty-controls">
                        <button class="btn-qty" onclick="cartManager.alterQty(${product.id}, 'minus')">-</button>
                        <span class="qty-value">${product.quantity}</span>
                        <button class="btn-qty" onclick="cartManager.alterQty(${product.id}, 'plus')">+</button>
                    </div>
                </div>
            `;
        });

        totalSumElement.innerText = grandTotalSum.toLocaleString('uz-UZ') + " so'm";
    }
};


const checkoutFlow = {
    getLocation: function() {
        const btn = document.getElementById('btn-get-location');
        const status = document.getElementById('location-status');
        const input = document.getElementById('input-location');

        if (!navigator.geolocation) {
            status.innerHTML = `<span class="text-danger"><i class="fa-solid fa-circle-xmark me-1"></i>GPS qo'llab-quvvatlanmaydi.</span>`;
            return;
        }

        btn.disabled = true;
        status.innerHTML = `<span class="text-muted"><i class="fa-solid fa-spinner fa-spin me-1"></i>Lokatsiya aniqlanmoqda...</span>`;

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                input.dataset.mapsLink = `https://www.google.com/maps?q=${lat},${lon}`;
                input.dataset.lat = lat;
                input.dataset.lon = lon;
                input.value = `${lat},${lon}`;

                btn.classList.remove('btn-outline-primary');
                btn.classList.add('btn-success', 'text-white');
                status.innerHTML = `<span class="text-success"><i class="fa-solid fa-circle-check me-1"></i>Lokatsiya muvaffaqiyatli aniqlandi!</span>`;
                btn.disabled = false;
            },
            (error) => {
                status.innerHTML = `<span class="text-danger"><i class="fa-solid fa-circle-xmark me-1"></i>GPS ruxsat berilmadi yoki xatolik.</span>`;
                btn.disabled = false;
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    },

    openOrderModal: function() {
        const cartModalInstance = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
        if (cartModalInstance) cartModalInstance.hide();
        
        const checkoutModal = new bootstrap.Modal(document.getElementById('orderModal'));
        checkoutModal.show();
    },

    togglePaymentSection: function() {
        const isOnlineChosen = document.getElementById('pay-online').checked;
        const uploadBox = document.getElementById('receipt-upload-box');
        uploadBox.style.display = isOnlineChosen ? 'block' : 'none';
    },

    submitOrder: async function(event) {
        event.preventDefault();

        const BOT_TOKEN = '8841506182:AAFa1GnVKvznKAWrC1zVrtSrxRct20NAtU4';
        const ADMIN_CHAT_ID = '-5348823240';

        const clientName = document.getElementById('input-fullname').value;
        const clientPhone = document.getElementById('input-phone').value;
        const locationInput = document.getElementById('input-location');
        const mapsLink = locationInput.dataset.mapsLink || null;
        const paymentOption = document.querySelector('input[name="paymentMethod"]:checked').value;
        const receiptFile = document.getElementById('file-receipt').files[0];

        if (!locationInput.dataset.lat) {
            document.getElementById('location-status').innerHTML = 
                `<span class="text-danger"><i class="fa-solid fa-circle-xmark me-1"></i>Iltimos, avval GPS orqali lokatsiyangizni oling!</span>`;
            return;
        }

        const totalSum = shoppingCartState.reduce((acc, p) => acc + p.price * p.quantity, 0);
        const orderLines = shoppingCartState.map(p => `  • ${p.name} x${p.quantity} — ${(p.price * p.quantity).toLocaleString('uz-UZ')} so'm`).join('\n');
        const paymentLabel = paymentOption === 'online' ? '💳 Onlayn (Karta)' : '💵 Naqd pul (Yetkazilganda)';

        const message = 
`🏗️ *YANGI TA'MIRLASH BUYURTMASI!*

👤 *Mijoz:* ${clientName}
📞 *Telefon:* ${clientPhone}
📍 *Lokatsiya:* [Xaritada ko'rish](${mapsLink})

📦 *Buyurtma tarkibi:*
${orderLines}

💰 *Jami summa:* ${totalSum.toLocaleString('uz-UZ')} so'm
💳 *To'lov usuli:* ${paymentLabel}`;

        const submitBtn = document.querySelector('#mainOrderForm [type="submit"]');
        submitBtn.disabled = true;

        try {
            // 1. Matnli xabarni Telegram botga yuborish
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text: message, parse_mode: 'Markdown' })
            });

            // 2. Haqiqiy jonli GPS xaritani yuborish
            if (locationInput.dataset.lat && locationInput.dataset.lon) {
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendLocation`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: ADMIN_CHAT_ID,
                        latitude: parseFloat(locationInput.dataset.lat),
                        longitude: parseFloat(locationInput.dataset.lon)
                    })
                });
            }

            // 3. Agar onlayn to'lov bo'lib, chek yuklangan bo'lsa yuborish
            if (receiptFile) {
                const formData = new FormData();
                formData.append('chat_id', ADMIN_CHAT_ID);
                formData.append('photo', receiptFile);
                formData.append('caption', `📎 ${clientName} ning to'lov cheki`);
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: 'POST', body: formData });
            }

            alert(`✅ Rahmat, ${clientName}!\nBuyurtmangiz muvaffaqiyatli qabul qilindi. Mahsulotlar tez fursatda manzilingizga yetkaziladi!`);
            
            // Savatni tozalash va yopish
            shoppingCartState = [];
            cartManager.syncDOM();
            document.getElementById('mainOrderForm').reset();
            this.togglePaymentSection();

            const checkoutModalInstance = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
            if (checkoutModalInstance) checkoutModalInstance.hide();

        } catch (err) {
            alert('❌ Xatolik yuz berdi! Internet aloqasini tekshiring.');
        } finally {
            submitBtn.disabled = false;
        }
    }
};