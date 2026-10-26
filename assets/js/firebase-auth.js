// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
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
    document.getElementById('authModal').style.display = 'flex';
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

// Отслеживание состояния авторизации
auth.onAuthStateChanged(function(user) {
    var triggerBtn = document.getElementById('authTriggerBtn');
    var loggedOutView = document.getElementById('loggedOutView');
    var loggedInView = document.getElementById('loggedInView');
    var addReviewContainer = document.getElementById('addReviewContainer');
    var loginRequiredMsg = document.getElementById('loginRequiredMsg');

    if (user) {
        var name = user.displayName || user.email.split('@')[0];
        var firstLetter = name.charAt(0).toUpperCase();

        triggerBtn.className = 'auth-icon-btn logged-in';
        triggerBtn.innerHTML = firstLetter;

        document.getElementById('profileAvatarBig').innerHTML = firstLetter;
        document.getElementById('profileName').innerHTML = name;
        document.getElementById('profileEmail').innerHTML = user.email;

        loggedOutView.style.display = 'none';
        loggedInView.style.display = 'block';

        if (addReviewContainer) addReviewContainer.style.display = 'block';
        if (loginRequiredMsg) loginRequiredMsg.style.display = 'none';
    } else {
        triggerBtn.className = 'auth-icon-btn';
        triggerBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="#e8eaed"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

        loggedOutView.style.display = 'block';
        loggedInView.style.display = 'none';

        if (addReviewContainer) addReviewContainer.style.display = 'none';
        if (loginRequiredMsg) loginRequiredMsg.style.display = 'block';
    }
});

// Регистрация
function handleRegister(e) {
    e.preventDefault();
    var name = document.getElementById('regName').value;
    var email = document.getElementById('regEmail').value;
    var password = document.getElementById('regPassword').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then(function(credential) {
            return credential.user.updateProfile({ displayName: name });
        })
        .then(function() {
            closeAuthModal();
        })
        .catch(function(error) {
            alert('Ошибка регистрации: ' + error.message);
        });
}

// Вход
function handleLogin(e) {
    e.preventDefault();
    var email = document.getElementById('loginEmail').value;
    var password = document.getElementById('loginPassword').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(function() {
            closeAuthModal();
        })
        .catch(function(error) {
            alert('Ошибка входа: ' + error.message);
        });
}

// Выход
function handleLogout() {
    auth.signOut().then(function() {
        closeAuthModal();
    });
}

// Отправка отзыва в Firestore
function submitReview(e) {
    e.preventDefault();
    var user = auth.currentUser;
    if (!user) return;

    var rating = parseInt(document.getElementById('reviewRating').value);
    var comment = document.getElementById('reviewComment').value;
    var name = user.displayName || user.email.split('@')[0];

    db.collection('reviews').add({
        userId: user.uid,
        userName: name,
        userEmail: user.email,
        rating: rating,
        comment: comment,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() {
        document.getElementById('reviewComment').value = '';
        loadReviews();
    }).catch(function(error) {
        alert('Ошибка отправки: ' + error.message);
    });
}

// Загрузка отзывов из Firestore
function loadReviews() {
    var listContainer = document.getElementById('reviewsList');
    if (!listContainer) return;
    
    listContainer.innerHTML = 'Загрузка отзывов...';

    db.collection('reviews').orderBy('createdAt', 'desc').get()
        .then(function(querySnapshot) {
            listContainer.innerHTML = '';
            if (querySnapshot.empty) {
                listContainer.innerHTML = '<p style="color: #9aa0a6; font-size: 14px;">Пока нет отзывов. Станьте первым!</p>';
                return;
            }

            querySnapshot.forEach(function(doc) {
                var data = doc.data();
                var name = data.userName || 'Аноним';
                var firstLetter = name.charAt(0).toUpperCase();
                var stars = '⭐'.repeat(data.rating || 5);

                var item = document.createElement('div');
                item.className = 'review-item';
                item.innerHTML = 
                    '<div class="review-header">' +
                        '<div class="review-avatar">' + firstLetter + '</div>' +
                        '<div class="review-author" onclick="openUserProfile(\'' + data.userName + '\', \'' + data.userEmail + '\')">' + name + '</div>' +
                        '<div class="review-stars">' + stars + '</div>' +
                    '</div>' +
                    '<p class="review-text">' + escapeHtml(data.comment) + '</p>';
                listContainer.appendChild(item);
            });
        })
        .catch(function(error) {
            listContainer.innerHTML = '<p style="color: #f28b82;">Ошибка загрузки отзывов.</p>';
        });
}

// Просмотр профиля другого пользователя
function openUserProfile(name, email) {
    var firstLetter = name.charAt(0).toUpperCase();
    document.getElementById('viewAvatar').innerHTML = firstLetter;
    document.getElementById('viewName').innerHTML = name;
    document.getElementById('viewEmail').innerHTML = email;
    document.getElementById('userProfileModal').style.display = 'flex';
}

function closeUserProfileModal() {
    document.getElementById('userProfileModal').style.display = 'none';
}

function escapeHtml(text) {
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Загружаем отзывы при загрузке страницы
window.onload = function() {
    if (typeof originalWindowOnload === 'function') {
        originalWindowOnload();
    }
    loadReviews();
};
