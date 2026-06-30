let shoppingCartState = [];

const LANG = (document.documentElement.lang || 'uz').toLowerCase().startsWith('ru') ? 'ru' : 'uz';

const i18n = {
    uz: {
        headingMap: {
            'material': "Devor va shiftni bezash materiallari",
            'santexnika': "Santexnika va quvur jihozlari",
            'elektr': "Elektrika jihozlari",
            'asboblar': "Qo'l mehnat asboblari (Instrumentlar)"
        },
        defaultHeading: 'Qurilish Mollari',
        emptyCartHtml: `
                <div class="text-center py-5 text-muted">
                    <i class="fa-solid fa-basket-shopping fs-1 d-block mb-3 text-light"></i>
                    Savat bo'sh. Mahsulot qo'shing!
                </div>`,
        zeroSum: "0 so'm",
        sumSuffix: " so'm",
        locale: 'uz-UZ',
        gpsNotSupported: "GPS qo'llab-quvvatlanmaydi.",
        gpsLocating: "Lokatsiya aniqlanmoqda...",
        gpsSuccess: "Lokatsiya muvaffaqiyatli aniqlandi!",
        gpsError: "GPS ruxsat berilmadi yoki xatolik.",
        gpsRequired: "Iltimos, avval GPS orqali lokatsiyangizni oling!",
        phoneInvalid: "Telefon raqamni to'liq kiriting! Masalan: +998 90 123 4567",
        nameInvalid: "Ism va familiyani to'g'ri kiriting (faqat harflar)!",
        telegramMessage: (clientName, clientPhone, mapsLink, orderLines, totalSum) =>
`🏗️ *YANGI TA'MIRLASH BUYURTMASI!*

👤 *Mijoz:* ${clientName}
📞 *Telefon:* ${clientPhone}
📍 *Lokatsiya:* [Xaritada ko'rish](${mapsLink})

📦 *Buyurtma tarkibi:*
${orderLines}

💰 *Jami summa:* ${totalSum}
💳 *To'lov usuli:* 💳 Karta orqali (Click/Payme)`,
        receiptCaption: (clientName) => `📎 ${clientName} ning to'lov cheki`,
        thankYou: (clientName) => `✅ Rahmat, ${clientName}!\nBuyurtmangiz muvaffaqiyatli qabul qilindi. Mahsulotlar tez fursatda manzilingizga yetkaziladi!`,
        errorMsg: '❌ Xatolik yuz berdi! Internet aloqasini tekshiring.'
    },
    ru: {
        headingMap: {
            'material': "Материалы для отделки стен и потолков",
            'santexnika': "Сантехника и трубопроводное оборудование",
            'elektr': "Электрооборудование",
            'asboblar': "Ручные инструменты"
        },
        defaultHeading: 'Строительные материалы',
        emptyCartHtml: `
                <div class="text-center py-5 text-muted">
                    <i class="fa-solid fa-basket-shopping fs-1 d-block mb-3 text-light"></i>
                    Корзина пуста. Добавьте товар!
                </div>`,
        zeroSum: "0 сум",
        sumSuffix: " сум",
        locale: 'ru-RU',
        gpsNotSupported: "GPS не поддерживается.",
        gpsLocating: "Определение локации...",
        gpsSuccess: "Локация успешно определена!",
        gpsError: "Доступ к GPS не разрешён или произошла ошибка.",
        gpsRequired: "Пожалуйста, сначала определите вашу локацию через GPS!",
        phoneInvalid: "Введите номер телефона полностью! Например: +998 90 123 4567",
        nameInvalid: "Введите корректные имя и фамилию (только буквы)!",
        telegramMessage: (clientName, clientPhone, mapsLink, orderLines, totalSum) =>
`🏗️ *НОВЫЙ ЗАКАЗ НА РЕМОНТ!*

👤 *Клиент:* ${clientName}
📞 *Телефон:* ${clientPhone}
📍 *Локация:* [Посмотреть на карте](${mapsLink})

📦 *Состав заказа:*
${orderLines}

💰 *Общая сумма:* ${totalSum}
💳 *Способ оплаты:* 💳 Картой (Click/Payme)`,
        receiptCaption: (clientName) => `📎 Чек об оплате от ${clientName}`,
        thankYou: (clientName) => `✅ Спасибо, ${clientName}!\nВаш заказ успешно принят. Товары будут доставлены по вашему адресу в ближайшее время!`,
        errorMsg: '❌ Произошла ошибка! Проверьте подключение к интернету.'
    }
};

const T = i18n[LANG];

function switchCategory(categoryName, clickTarget) {

    document.querySelectorAll('.nav-tabs-custom .nav-link').forEach(btn => btn.classList.remove('active'));
    clickTarget.classList.add('active');

    document.getElementById('current-category-heading').innerText = T.headingMap[categoryName] || T.defaultHeading;


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
            itemsContainer.innerHTML = T.emptyCartHtml;
            totalSumElement.innerText = T.zeroSum;
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
                        <span class="text-primary fw-bold small">${product.price.toLocaleString(T.locale)}${T.sumSuffix}</span>
                    </div>
                    <div class="qty-controls">
                        <button class="btn-qty" onclick="cartManager.alterQty(${product.id}, 'minus')">-</button>
                        <span class="qty-value">${product.quantity}</span>
                        <button class="btn-qty" onclick="cartManager.alterQty(${product.id}, 'plus')">+</button>
                    </div>
                </div>
            `;
        });

        totalSumElement.innerText = grandTotalSum.toLocaleString(T.locale) + T.sumSuffix;
    }
};


const checkoutFlow = {
    formatPhone: function(event) {
        const input = event.target;
        let digits = input.value.replace(/\D/g, '');

        if (digits.startsWith('998')) {
            digits = digits.slice(3);
        }
        digits = digits.slice(0, 9);

        let formatted = '+998';
        if (digits.length > 0) formatted += ' ' + digits.slice(0, 2);
        if (digits.length > 2) formatted += ' ' + digits.slice(2, 5);
        if (digits.length > 5) formatted += ' ' + digits.slice(5, 7);
        if (digits.length > 7) formatted += ' ' + digits.slice(7, 9);

        input.value = formatted;
    },

    filterName: function(event) {
        const input = event.target;
        const cursorPos = input.selectionStart;
        const before = input.value.length;
        input.value = input.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿʻʼ'\u0400-\u04FF\s-]/g, '');
        const diff = before - input.value.length;
        input.setSelectionRange(cursorPos - diff, cursorPos - diff);
    },

    isPhoneValid: function(phoneValue) {
        const digits = phoneValue.replace(/\D/g, '').replace(/^998/, '');
        return digits.length === 9;
    },

    isNameValid: function(nameValue) {
        return /^[A-Za-zÀ-ÖØ-öø-ÿʻʼ'\u0400-\u04FF\s-]{2,}$/.test(nameValue.trim());
    },

    getLocation: function() {
        const btn = document.getElementById('btn-get-location');
        const status = document.getElementById('location-status');
        const input = document.getElementById('input-location');

        if (!navigator.geolocation) {
            status.innerHTML = `<span class="text-danger"><i class="fa-solid fa-circle-xmark me-1"></i>${T.gpsNotSupported}</span>`;
            return;
        }

        btn.disabled = true;
        status.innerHTML = `<span class="text-muted"><i class="fa-solid fa-spinner fa-spin me-1"></i>${T.gpsLocating}</span>`;

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
                status.innerHTML = `<span class="text-success"><i class="fa-solid fa-circle-check me-1"></i>${T.gpsSuccess}</span>`;
                btn.disabled = false;
            },
            (error) => {
                status.innerHTML = `<span class="text-danger"><i class="fa-solid fa-circle-xmark me-1"></i>${T.gpsError}</span>`;
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
        const uploadBox = document.getElementById('receipt-upload-box');
        uploadBox.style.display = 'block';
    },

    submitOrder: async function(event) {
        event.preventDefault();

        const BOT_TOKEN = '8841506182:AAFa1GnVKvznKAWrC1zVrtSrxRct20NAtU4';
        const ADMIN_CHAT_ID = '-5348823240';

        const clientName = document.getElementById('input-fullname').value;
        const clientPhone = document.getElementById('input-phone').value;
        const locationInput = document.getElementById('input-location');
        const mapsLink = locationInput.dataset.mapsLink || null;
        const receiptFile = document.getElementById('file-receipt').files[0];

        if (!this.isNameValid(clientName)) {
            alert(T.nameInvalid);
            document.getElementById('input-fullname').focus();
            return;
        }

        if (!this.isPhoneValid(clientPhone)) {
            alert(T.phoneInvalid);
            document.getElementById('input-phone').focus();
            return;
        }

        if (!locationInput.dataset.lat) {
            document.getElementById('location-status').innerHTML = 
                `<span class="text-danger"><i class="fa-solid fa-circle-xmark me-1"></i>${T.gpsRequired}</span>`;
            return;
        }

        const totalSum = shoppingCartState.reduce((acc, p) => acc + p.price * p.quantity, 0);
        const orderLines = shoppingCartState.map(p => `  • ${p.name} x${p.quantity} — ${(p.price * p.quantity).toLocaleString(T.locale)}${T.sumSuffix}`).join('\n');

        const message = T.telegramMessage(clientName, clientPhone, mapsLink, orderLines, totalSum.toLocaleString(T.locale) + T.sumSuffix);

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
                formData.append('caption', T.receiptCaption(clientName));
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: 'POST', body: formData });
            }

            alert(T.thankYou(clientName));
            
            // Savatni tozalash va yopish
            shoppingCartState = [];
            cartManager.syncDOM();
            document.getElementById('mainOrderForm').reset();
            this.togglePaymentSection();

            const checkoutModalInstance = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
            if (checkoutModalInstance) checkoutModalInstance.hide();

        } catch (err) {
            alert(T.errorMsg);
        } finally {
            submitBtn.disabled = false;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    cartManager.syncDOM();
});