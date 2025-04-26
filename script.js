// ======================
// Display Tasks from Firestore on Homepage or Available Tasks
// ======================
let tasks = []; // Global tasks array
let selectedCity = "";
let selectedCountry = "";
let selectedLat = "";
let selectedLng = "";

// ======================
// Initialize Google Maps Autocomplete
// ======================
function initializeAutocomplete() {
    const locationInput = document.getElementById('location');
    if (locationInput) {
        const autocomplete = new google.maps.places.Autocomplete(locationInput);

        autocomplete.addListener('place_changed', function () {
            const place = autocomplete.getPlace();

            if (place.geometry) {
                selectedLat = place.geometry.location.lat();
                selectedLng = place.geometry.location.lng();
            }

            if (place.address_components) {
                selectedCity = "";
                selectedCountry = "";

                for (const component of place.address_components) {
                    const types = component.types;
                    if (types.includes('locality')) {
                        selectedCity = component.long_name;
                    }
                    if (types.includes('country')) {
                        selectedCountry = component.long_name;
                    }
                }
            }
            console.log("Selected City:", selectedCity);
            console.log("Selected Country:", selectedCountry);
            console.log("Selected LatLng:", selectedLat, selectedLng);
        });
    }
}

function loadTasks() {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;

    db.collection('tasks')
        .orderBy('createdAt', 'desc')
        .get()
        .then((snapshot) => {
            tasks = [];
            taskList.innerHTML = "";

            snapshot.forEach((doc) => {
                const task = doc.data();
                tasks.push(task);

                const div = document.createElement('div');
                div.className = 'task-card';

                if (window.location.pathname.includes('available-tasks.html')) {
                    div.innerHTML = `
                        <h3>${task.title}</h3>
                        <p>${task.description || ''}</p>
                        <p>Price: $${task.price}</p>
                        <p>Location: ${task.location || 'Not specified'}</p>
                        <button onclick="viewTaskDetail('${doc.id}')">View Details</button>
                    `;
                } else {
                    div.innerHTML = `
                        <h3>${task.title}</h3>
                        <p>${task.description || ''}</p>
                        <p>Price: $${task.price}</p>
                        <p>Location: ${task.location || 'Not specified'}</p>
                    `;
                }

                taskList.appendChild(div);
            });
        })
        .catch((error) => {
            console.error('Error loading tasks:', error);
        });
}

// ======================
// View Task Detail
// ======================
function viewTaskDetail(taskId) {
    localStorage.setItem('selectedTaskId', taskId);
    window.location.href = 'task-detail.html';
}


// ======================
// Firebase SIGNUP
// ======================
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const role = document.getElementById('role').value;

        auth.createUserWithEmailAndPassword(email, password)
            .then(function (userCredential) {
                return db.collection('users').doc(userCredential.user.uid).set({
                    email: email,
                    role: role,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(function () {
                alert("Signup successful! Please login.");
                window.location.href = "login.html";
            })
            .catch(function (error) {
                alert(error.message);
            });
    });
}

// ======================
// Firebase LOGIN
// ======================
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then(function () {
                alert('Login successful!');
                window.location.href = 'index.html';
            })
            .catch(function (error) {
                alert(error.message);
            });
    });
}

// ======================
// Handle Logout
// ======================
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
        auth.signOut().then(function () {
            alert('Logged out successfully!');
            window.location.href = 'login.html';
        });
    });
}

// ======================
// Check Firebase Login Status and Role
// ======================
function checkLoginStatus() {
    auth.onAuthStateChanged(function (user) {
        const logoutBtn = document.getElementById('logout-btn');
        const loginLink = document.getElementById('login-link');
        const signupLink = document.getElementById('signup-link');
        const welcomeBanner = document.getElementById('welcome-banner');
        const adminLink = document.getElementById('admin-link');
        const postTaskLink = document.getElementById('post-task-link');
        const availableTasksLink = document.getElementById('available-tasks-link');

        if (user) {
            console.log('User is logged in:', user.email);

            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            if (loginLink) loginLink.style.display = 'none';
            if (signupLink) signupLink.style.display = 'none';
            if (welcomeBanner) welcomeBanner.innerText = `Welcome, ${user.email}`;

            db.collection('users').doc(user.uid).get().then(function (doc) {
                if (doc.exists) {
                    const userRole = doc.data().role;

                    if (userRole === 'customer') {
                        if (postTaskLink) postTaskLink.style.display = 'inline-block';
                        if (availableTasksLink) availableTasksLink.style.display = 'none';
                    } else if (userRole === 'doer') {
                        if (availableTasksLink) availableTasksLink.style.display = 'inline-block';
                        if (postTaskLink) postTaskLink.style.display = 'none';
                    }

                    if (userRole === 'admin') {
                        if (adminLink) adminLink.style.display = 'inline-block';
                    } else {
                        if (adminLink) adminLink.style.display = 'none';
                    }
                }
            });

        } else {
            console.log('No user is logged in');
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (loginLink) loginLink.style.display = 'inline-block';
            if (signupLink) signupLink.style.display = 'inline-block';
            if (welcomeBanner) welcomeBanner.innerText = '';
            if (postTaskLink) postTaskLink.style.display = 'none';
            if (availableTasksLink) availableTasksLink.style.display = 'none';
            if (adminLink) adminLink.style.display = 'none';
        }
    });
}

// ======================
// Initialize on Page Load
// ======================
    window.onload = function () {
        loadTasks();
        checkLoginStatus();
        initializeAutocomplete(); // <-- Add this line
    };


// ======================
// Support Chat Feature
// ======================
const chatForm = document.getElementById('chat-form');
const chatBox = document.getElementById('chat-box');

if (chatForm && chatBox) {
    auth.onAuthStateChanged(function (user) {
        if (!user) {
            alert('You must be logged in to chat!');
            window.location.href = 'login.html';
        } else {
            db.collection('chats')
                .orderBy('createdAt')
                .onSnapshot(function (snapshot) {
                    chatBox.innerHTML = "";
                    snapshot.forEach(function (doc) {
                        const chat = doc.data();
                        const div = document.createElement('div');
                        div.innerHTML = `<strong>${chat.user}:</strong> ${chat.message}`;
                        chatBox.appendChild(div);
                    });
                    chatBox.scrollTop = chatBox.scrollHeight;
                });

            chatForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const message = document.getElementById('chat-message').value;

                db.collection('chats').add({
                    user: user.email,
                    message: message,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                })
                    .then(function () {
                        document.getElementById('chat-message').value = '';
                    })
                    .catch(function (error) {
                        alert('Error sending message: ' + error.message);
                    });
            });
        }
    });
}

// ======================
// Admin Dashboard Feature
// ======================
const adminSection = document.getElementById('admin-section');
const accessDenied = document.getElementById('access-denied');
const usersList = document.getElementById('users-list');
const chatsList = document.getElementById('chats-list');
const adminReplyForm = document.getElementById('admin-reply-form');

if (adminSection && accessDenied) {
    auth.onAuthStateChanged(function (user) {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            db.collection('users').doc(user.uid).get().then(function (doc) {
                if (doc.exists && doc.data().role === 'admin') {
                    adminSection.style.display = 'block';
                    accessDenied.style.display = 'none';
                    loadUsers();
                    loadChats();
                } else {
                    adminSection.style.display = 'none';
                    accessDenied.style.display = 'block';
                }
            });
        }
    });
}

function loadUsers() {
    db.collection('users').get().then(function (snapshot) {
        usersList.innerHTML = "";
        snapshot.forEach(function (doc) {
            const user = doc.data();
            const div = document.createElement('div');
            div.innerHTML = `<p><strong>Email:</strong> ${user.email} | <strong>Role:</strong> ${user.role || 'user'}</p>`;
            usersList.appendChild(div);
        });
    });
}

function loadChats() {
    db.collection('chats').orderBy('createdAt').get().then(function (snapshot) {
        chatsList.innerHTML = "";
        snapshot.forEach(function (doc) {
            const chat = doc.data();
            const div = document.createElement('div');
            div.innerHTML = `<p><strong>${chat.user}:</strong> ${chat.message}</p>`;
            chatsList.appendChild(div);
        });
    });
}

if (adminReplyForm) {
    adminReplyForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const toUser = document.getElementById('reply-to').value;
        const message = document.getElementById('reply-message').value;

        db.collection('chats').add({
            user: 'Admin Reply to ' + toUser,
            message: message,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
            .then(function () {
                alert('Reply sent!');
                document.getElementById('reply-to').value = '';
                document.getElementById('reply-message').value = '';
                loadChats();
            })
            .catch(function (error) {
                alert('Error sending reply: ' + error.message);
            });
    });
}
