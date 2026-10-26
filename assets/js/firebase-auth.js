// Конфигурация Firebase
var firebaseConfig = {
    apiKey: "AIzaSyCp9X7TVqDvPDV3k0Lq99rmdgOHVnydfRo",
    authDomain: "services-6da77.firebaseapp.com",
    projectId: "services-6da77",
    storageBucket: "services-6da77.firebasestorage.app",
    messagingSenderId: "270869443470",
    appId: "1:270869443470:web:ecdcdb68abc38586e0eadf",
    measurementId: "G-MFTCVNR56D"
};

// Инициализация Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
var auth = firebase.auth();
var db = firebase.firestore();

// Управление вкладками входа/регистрации
function switchAuthTab(tab) {
    var loginForm = document.getElementById('loginForm');
    var registerForm = document.getElementById('registerForm');
    var tabLogin = document.getElementById('tabLogin');
    var tabRegister = document.getElementById('tabRegister');

    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        tabLogin.className = 'auth-tab active';
        tabRegister.className = 'auth-tab';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        tabLogin.className = 'auth-tab';
        tabRegister.className = 'auth-tab active';
    }
}

function openAuthModal() {
    var modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'flex';
}

function closeAuthModal() {
    var modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
}

// Отслеживание состояния авторизации
auth.onAuthStateChanged(function(user) {
    var triggerBtn = document.getElementById('authTriggerBtn');
    var loggedOutView = document.getElementById('loggedOutView');
    var loggedInView = document.getElementById('loggedInView');
    var addReviewContainer = document.getElementById('addReviewContainer');
    var loginRequiredMsg = document.getElementById('loginRequiredMsg');

    if (!triggerBtn) return;

    if (user) {
        var name = user.displayName || user.email.split('@')[0];
        var firstLetter = name.charAt(0).toUpperCase();

        triggerBtn.className = 'auth-icon-btn logged-in';
        triggerBtn.innerHTML = firstLetter;

        var pAvatar = document.getElementById('profileAvatarBig');
        var pName = document.getElementById('profileName');
        var pEmail = document.getElementById('profileEmail');

        if (pAvatar) pAvatar.innerHTML = firstLetter;
        if (pName) pName.innerHTML = name;
        if (pEmail) pEmail.innerHTML = user.email;

        if (loggedOutView) loggedOutView.style.display = 'none';
        if (loggedInView) loggedInView.style.display = 'block';
        if (addReviewContainer) addReviewContainer.style.display = 'block';
        if (loginRequiredMsg) loginRequiredMsg.style.display = 'none';
    } else {
        triggerBtn.className = 'auth-icon-btn';
        triggerBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="#e8eaed"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

        if (loggedOutView) loggedOutView.style.display = 'block';
        if (loggedInView) loggedInView.style.display = 'none';
        if (addReviewContainer) addReviewContainer.style.display = 'none';
        if (loginRequiredMsg) loginRequiredMsg.style.display = 'block';
    }
});

// Регистрация (адаптировано для старого Edge)
function handleRegister(e) {
    if (e && e.preventDefault) e.preventDefault();
    var nameInput = document.getElementById('regName');
    var emailInput = document.getElementById('regEmail');
    var passwordInput = document.getElementById('regPassword');

    if (!emailInput || !passwordInput) return;

    var name = nameInput.value;
    var email = emailInput.value;
    var password = passwordInput.value;

    auth.createUserWithEmailAndPassword(email, password).then(function(credential) {
        if (credential && credential.user) {
            credential.user.updateProfile({ displayName: name }).then(function() {
                closeAuthModal();
            }).catch(function() {
                closeAuthModal();
            });
        } else {
            closeAuthModal();
        }
    }).catch(function(error) {
        alert('Ошибка регистрации: ' + (error.message || error));
    });
    return false;
}

// Вход (адаптировано для старого Edge)
function handleLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    var emailInput = document.getElementById('loginEmail');
    var passwordInput = document.getElementById('loginPassword');

    if (!emailInput || !passwordInput) return;

    var email = emailInput.value;
    var password = passwordInput.value;

    auth.signInWithEmailAndPassword(email, password).then(function() {
        closeAuthModal();
    }).catch(function(error) {
        alert('Ошибка входа: ' + (error.message || error));
    });
    return false;
}

// Выход
function handleLogout() {
    auth.signOut().then(function() {
        closeAuthModal();
    }).catch(function(error) {
        alert('Ошибка выхода: ' + (error.message || error));
    });
}

// Отправка отзыва в Firestore
function submitReview(e) {
    if (e && e.preventDefault) e.preventDefault();
    var user = auth.currentUser;
    if (!user) {
        alert('Пожалуйста, войдите в аккаунт');
        return false;
    }

    var ratingSelect = document.getElementById('reviewRating');
    var commentInput = document.getElementById('reviewComment');
    if (!ratingSelect || !commentInput) return false;

    var rating = parseInt(ratingSelect.value, 10);
    var comment = commentInput.value;
    var name = user.displayName || user.email.split('@')[0];

    db.collection('reviews').add({
        userId: user.uid,
        userName: name,
        userEmail: user.email,
        rating: rating,
        comment: comment,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() {
        commentInput.value = '';
        loadReviews();
    }).catch(function(error) {
        alert('Ошибка отправки отзыва: ' + (error.message || error));
    });
    return false;
}

// Загрузка отзывов из Firestore
function loadReviews() {
    var listContainer = document.getElementById('reviewsList');
    if (!listContainer) return;
    
    listContainer.innerHTML = 'Загрузка отзывов...';

    db.collection('reviews').orderBy('createdAt', 'desc').get().then(function(querySnapshot) {
        listContainer.innerHTML = '';
        if (querySnapshot.empty) {
            listContainer.innerHTML = '<p style="color: #9aa0a6; font-size: 14px;">Пока нет отзывов. Станьте первым!</p>';
            return;
        }

        querySnapshot.forEach(function(doc) {
            var data = doc.data();
            var name = data.userName || 'Аноним';
            var firstLetter = name.charAt(0).toUpperCase();
            
            var starsCount = data.rating || 5;
            var stars = '';
            for (var i = 0; i < starsCount; i++) {
                stars += '⭐';
            }

            var item = document.createElement('div');
            item.className = 'review-item';
            item.innerHTML = 
                '<div class="review-header">' +
                    '<div class="review-avatar">' + firstLetter + '</div>' +
                    '<div class="review-author" onclick="openUserProfile(\'' + encodeURIComponent(data.userName) + '\', \'' + encodeURIComponent(data.userEmail) + '\')">' + escapeHtml(name) + '</div>' +
                    '<div class="review-stars">' + stars + '</div>' +
                '</div>' +
                '<p class="review-text">' + escapeHtml(data.comment || '') + '</p>';
            listContainer.appendChild(item);
        });
    }).catch(function(error) {
        listContainer.innerHTML = '<p style="color: #f28b82;">Не удалось загрузить отзывы.</p>';
    });
}

// Просмотр профиля другого пользователя
function openUserProfile(encName, encEmail) {
    var name = decodeURIComponent(encName);
    var email = decodeURIComponent(encEmail);
    var firstLetter = name.charAt(0).toUpperCase();

    var vAvatar = document.getElementById('viewAvatar');
    var vName = document.getElementById('viewName');
    var vEmail = document.getElementById('viewEmail');
    var vModal = document.getElementById('userProfileModal');

    if (vAvatar) vAvatar.innerHTML = firstLetter;
    if (vName) vName.innerHTML = escapeHtml(name);
    if (vEmail) vEmail.innerHTML = escapeHtml(email);
    if (vModal) vModal.style.display = 'flex';
}

function closeUserProfileModal() {
    var vModal = document.getElementById('userProfileModal');
    if (vModal) vModal.style.display = 'none';
}

function escapeHtml(text) {
    if (!text) return '';
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Автозагрузка при старте страницы
window.onload = function() {
    if (typeof originalWindowOnload === 'function') {
        originalWindowOnload();
    }
    loadReviews();
};
