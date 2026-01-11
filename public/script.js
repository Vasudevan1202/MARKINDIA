/*************************************************

GLOBAL STATE
*************************************************/
let currentUser = null;
let showingFilter = 'all'; // 'all', 'mine', 'fav'
let editingAdId = null;
let currentAds = [];
let currentCategory = '';

/*************************************************

HELPERS (PREVENT NULL ERRORS)
*************************************************/
const emailEl = () => document.getElementById("email");
const passwordEl = () => document.getElementById("password");
const confirmPasswordEl = () => document.getElementById("confirmPassword");
const fullNameEl = () => document.getElementById("fullName");
const phoneNumberEl = () => document.getElementById("phoneNumber");

function escapeHtml(str) {
if (str == null) return '';
return String(str)
.replace(/&/g, '&')
.replace(/</g, '<')
.replace(/>/g, '>')
.replace(/"/g, '"')
.replace(/'/g, ''');
}

/*************************************************

AUTH UI TOGGLE
*************************************************/
window.toggleAuth = function (showSignup) {
document.getElementById("authTitle").innerText = showSignup ? "Sign Up" : "Login";
document.getElementById("loginActions").style.display = showSignup ? "none" : "block";
document.getElementById("signupActions").style.display = showSignup ? "block" : "none";
};

/*************************************************

SIGN UP
*************************************************/
window.signup = function () {
const email = emailEl().value.trim();
const password = passwordEl().value;
const confirm = confirmPasswordEl().value;
const fullName = fullNameEl().value.trim();
const phone = phoneNumberEl().value.trim();

if (!email || !password || !confirm || !fullName || !phone) {
alert("Please fill all fields");
return;
}

if (password !== confirm) {
alert("Passwords do not match");
return;
}

auth.createUserWithEmailAndPassword(email, password)
.then((cred) => cred.user.updateProfile({ displayName: fullName }))
.then(() => {
localStorage.setItem("userFullName", fullName);
localStorage.setItem("userPhone", phone);
})
.catch((err) => alert(err.message));
};

/*************************************************

LOGIN
*************************************************/
window.login = function () {
const email = emailEl().value.trim();
const password = passwordEl().value;

if (!email || !password) {
alert("Enter email and password");
return;
}

auth.signInWithEmailAndPassword(email, password)
.catch((err) => alert(err.message));
};

/*************************************************

LOGOUT
*************************************************/
window.logout = function () {
auth.signOut();
};

/*************************************************

FAVORITES LOGIC
*************************************************/
function getFavorites() {
const favs = localStorage.getItem("favorites");
return favs ? JSON.parse(favs) : [];
}

window.toggleFavorite = function(adId, event) {
event.stopPropagation();
let favs = getFavorites();
if (favs.includes(adId)) {
favs = favs.filter(id => id !== adId);
} else {
favs.push(adId);
}
localStorage.setItem("favorites", JSON.stringify(favs));
filterAndSortAds();
};

/*************************************************

LOAD ADS (SAFE)
*************************************************/
window.loadAds = async function () {
const adsEl = document.getElementById("ads");
if (!adsEl) return;

try {
const res = await fetch("/api/ads");
const ads = await res.json();
currentAds = ads;
filterAndSortAds();
} catch (e) {
console.error("loadAds failed", e);
}
};

/*************************************************

FILTER AND SORT ADS
*************************************************/
window.filterAndSortAds = function() {
const adsEl = document.getElementById("ads");
if (!adsEl) return;

const userId = localStorage.getItem("userId");
const searchQuery = document.getElementById("searchInput")?.value.toLowerCase() || "";
const sortBy = document.getElementById("sortSelect")?.value || "latest";
const favorites = getFavorites();

let filtered = [...currentAds];

// 1. Main Tabs Filter
if (showingFilter === 'mine' && userId) {
filtered = filtered.filter(a => a.userId === userId);
} else if (showingFilter === 'fav') {
filtered = filtered.filter(a => favorites.includes(a._id));
}

// 2. Category Filter
if (currentCategory) {
filtered = filtered.filter(a => a.category === currentCategory);
}

// 3. Search Filter
if (searchQuery) {
filtered = filtered.filter(a =>
(a.title && a.title.toLowerCase().includes(searchQuery)) ||
(a.description && a.description.toLowerCase().includes(searchQuery))
);
}

// 4. Sorting
if (sortBy === 'latest') {
filtered.sort((a, b) => b._id.localeCompare(a._id));
} else if (sortBy === 'priceLowHigh') {
filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
} else if (sortBy === 'priceHighLow') {
filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
}

// Render
adsEl.innerHTML = "";
if (!filtered.length) {
adsEl.innerHTML = <p style='opacity:.6;text-align:center'>${showingFilter === 'fav' ? 'No favorites saved yet' : 'No ads found'}</p>;
return;
}

filtered.forEach(ad => {
const isFav = favorites.includes(ad._id);
const isMine = userId === ad.userId;
const card = document.createElement("div");
card.className = "ad-card";
card.dataset.id = ad._id;
card.dataset.category = ad.category;

const imagesHtml = (ad.images && Array.isArray(ad.images) && ad.images.length > 0)
? ad.images.map((img, idx) =>     <div class="ad-image-wrapper">     <img src="${escapeHtml(img)}" loading="lazy" class="ad-image" alt="${escapeHtml(ad.title)}" onerror="this.parentElement.innerHTML='<div class=\'no-image\'>Image Error</div>'">     ${ad.images.length > 1 ?<div class="image-counter">${idx + 1}/${ad.images.length}</div>: ''}     </div>    ).join('')
: <div class="ad-image-wrapper"><div class="no-image">No Image</div></div>;

card.innerHTML =     <button class="fav-btn" onclick="toggleFavorite('${escapeHtml(ad._id)}', event)" title="Favorite">     <span style="color: ${isFav ? '#ff5a5f' : '#002f34'}; font-size: 18px;">${isFav ? '❤️' : '🤍'}</span>     </button>     ${isMine ?
<button class="delete-btn" onclick="deleteAd('${escapeHtml(ad._id)}', event)" title="Delete">
<span style="font-size: 18px;">🗑️</span>
</button>
` : ''}

  <div class="ad-images">    
    ${imagesHtml}    
  </div>    
  <div class="price">₹ ${Number(ad.price).toLocaleString('en-IN')}</div>    
  <div class="badge">${escapeHtml(ad.category) || 'Others'}</div>    
  <h3>${escapeHtml(ad.title)}</h3>    
  <p>${escapeHtml(ad.description) || ''}</p>    
  <div class="location-row">    
    <div class="location">📍 ${escapeHtml(ad.location) || 'India'}</div>    
    <div class="ad-date">${new Date().toLocaleDateString('en-IN', {day:'2-digit', month:'short'})}</div>    
  </div>    
`;    
adsEl.appendChild(card);  });
};

/*************************************************

DELETE AD
*************************************************/
window.deleteAd = async function(adId, event) {
event.stopPropagation();
if (!confirm("Are you sure you want to delete this ad?")) return;

const userId = localStorage.getItem("userId");
try {
const res = await fetch(/api/ads/${adId}, {
method: "DELETE",
headers: {
"user-id": userId
}
});
if (res.ok) {
currentAds = currentAds.filter(a => a._id !== adId);
filterAndSortAds();
} else {
const err = await res.json();
alert(err.error || "Failed to delete ad");
}
} catch (e) {
console.error("Delete failed", e);
alert("Error deleting ad");
}
};

/*************************************************

FILTER ADS
*************************************************/
window.filterAds = function (type) {
showingFilter = type;
const allBtn = document.getElementById("showAllAds");
const myBtn = document.getElementById("showMyAds");
const favBtn = document.getElementById("showFavAds");

if (allBtn) allBtn.style.background = (type === 'all') ? "#22c55e" : "#374151";
if (myBtn) myBtn.style.background = (type === 'mine') ? "#22c55e" : "#374151";
if (favBtn) favBtn.style.background = (type === 'fav') ? "#22c55e" : "#374151";

filterAndSortAds();
};

/*************************************************

FILTER BY CATEGORY
*************************************************/
window.filterByCategory = function(cat, event) {
currentCategory = cat;
const btns = document.querySelectorAll(".cat-btn");
btns.forEach(b => b.classList.remove("active"));
if (event) event.target.classList.add("active");
filterAndSortAds();
};

/*************************************************

AUTH STATE OBSERVER (CRITICAL)
*************************************************/
auth.onAuthStateChanged((user) => {
const postSection = document.getElementById("postSection");
const logoutBtn = document.getElementById("logoutBtn");
const authCard = document.querySelector(".post-ad:not(#postSection)");

if (user) {
currentUser = user;
localStorage.setItem("userId", user.uid);
localStorage.setItem("userEmail", user.email);

if (postSection) postSection.style.display = "block";
if (logoutBtn) logoutBtn.style.display = "block";
if (authCard) authCard.style.display = "none";

} else {
currentUser = null;
const favs = localStorage.getItem("favorites");
localStorage.clear();
if (favs) localStorage.setItem("favorites", favs);

if (postSection) postSection.style.display = "none";
if (logoutBtn) logoutBtn.style.display = "none";
if (authCard) authCard.style.display = "block";

}

loadAds();
});

/*************************************************

POST AD
*************************************************/
window.postAd = async function () {
const title = document.getElementById("title").value.trim();
const price = document.getElementById("price").value.trim();
const description = document.getElementById("description").value.trim();
const category = document.getElementById("category").value;
const location = document.getElementById("location").value.trim();
const imageFiles = document.getElementById("imageInput").files;

if (!title || !price || !category) {
alert("Title, price, and category are required");
return;
}

const btn = document.getElementById("postAdBtn");
if (!btn) return;

btn.disabled = true;
btn.innerText = "Posting...";

try {
const imageUrls = [];

// Cloudinary Config (Unsigned Upload)
const CLOUD_NAME = "du0uabb38"; // From user request/existing context if available, otherwise using a placeholder to demonstrate fix
const UPLOAD_PRESET = "markindia_unsigned";

for (let i = 0; i < Math.min(imageFiles.length, 3); i++) {
const file = imageFiles[i];
const formData = new FormData();
formData.append("file", file);
formData.append("upload_preset", UPLOAD_PRESET);

try {
const response = await fetch(https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload, {
method: "POST",
body: formData
});

if (!response.ok) {    
  const errorData = await response.json();    
  throw new Error(errorData.error?.message || "Cloudinary upload failed");    
}    

const data = await response.json();    
if (data.secure_url) {    
  imageUrls.push(data.secure_url);    
} else {    
  throw new Error("Cloudinary response missing secure_url");    
}

} catch (uploadErr) {
console.error(Image ${i+1} upload failed:, uploadErr);
throw new Error(Failed to upload image ${i+1}. Please check your connection.);
}
}

const res = await fetch("/api/ads", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
title,
price,
description,
category,
location,
images: imageUrls,
userId: currentUser?.uid,
userEmail: currentUser?.email
})
});

if (res.ok) {
document.getElementById("successMsg").innerText = "Ad posted successfully!";
document.getElementById("successMsg").style.display = "block";
setTimeout(() => {
document.getElementById("successMsg").style.display = "none";
window.location.reload();
}, 2000);
} else {
const errData = await res.json();
throw new Error(errData.error || "Failed to save ad to database");
}

} catch (err) {
console.error("postAd overall failure:", err);
alert("Post Ad Error: " + err.message);
} finally {
if (btn) {
btn.disabled = false;
btn.innerText = "Post Ad";
}
}
};

window.previewImages = function() {
const preview = document.getElementById("imagePreview");
const files = document.getElementById("imageInput").files;
preview.innerHTML = "";
for (let i = 0; i < Math.min(files.length, 3); i++) {
const reader = new FileReader();
reader.onload = (e) => {
const img = document.createElement("img");
img.src = e.target.result;
img.style.width = "60px";
img.style.height = "60px";
img.style.borderRadius = "4px";
img.style.objectFit = "cover";
preview.appendChild(img);
};
reader.readAsDataURL(files[i]);
}
};

/*************************************************

INIT
*************************************************/
document.addEventListener("DOMContentLoaded", () => {
const allBtn = document.getElementById("showAllAds");
if (allBtn) allBtn.style.background = "#22c55e";
loadAds();
});
