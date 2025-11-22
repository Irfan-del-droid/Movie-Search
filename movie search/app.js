const API_KEY = "dc9a7080"; // REMINDER: Replace with your actual OMDb API key!

const searchInput = document.getElementById("searchInput");
const searchIcon = document.getElementById("searchIcon");
const suggestionsBox = document.getElementById("suggestions");

const movieList = document.getElementById("movieList");
const favoritesList = document.getElementById("favoritesList");

const loader = document.getElementById("loader");

const movieModal = document.getElementById("movieModal");
const movieDetails = document.getElementById("movieDetails");
const closeModal = document.getElementById("closeModal");

const pagination = document.getElementById("pagination");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageNumber = document.getElementById("pageNumber");

const themeIconContainer = document.getElementById("theme-icon-container");

let currentQuery = "";
let currentPage = 1;

/* ------------------------------------
   DARK MODE + SAVED PREFERENCE
------------------------------------ */
function setThemeIcon() {
    if (document.body.classList.contains("dark")) {
        themeIconContainer.textContent = "🌙"; // Moon icon for dark mode
    } else {
        themeIconContainer.textContent = "☀️"; // Sun icon for light mode
    }
}

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
}
setThemeIcon(); // Set initial icon

themeIconContainer.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
    setThemeIcon(); // Update icon after toggle
});

/* ------------------------------------
   SEARCH + AUTOCOMPLETE SUGGESTIONS
------------------------------------ */
searchInput.addEventListener("input", async () => {
    const q = searchInput.value.trim();

    if (q.length < 3) {
        suggestionsBox.classList.add("hidden");
        return;
    }

    const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${q}`);
    const data = await res.json();

    if (data.Response === "False") return;

    suggestionsBox.innerHTML = data.Search
        .slice(0, 5)
        .map(m => `<div>${m.Title}</div>`)
        .join("");

    suggestionsBox.classList.remove("hidden");

    [...suggestionsBox.children].forEach(item => {
        item.addEventListener("click", () => {
            searchInput.value = item.textContent;
            suggestionsBox.classList.add("hidden");
            searchMovies();
        });
    });
});

/* ------------------------------------
   SEARCH FUNCTION
------------------------------------ */
searchIcon.addEventListener("click", searchMovies);
searchInput.addEventListener("keypress", e => {
    if (e.key === "Enter") searchMovies();
});

async function searchMovies(page = 1) {
    const query = searchInput.value.trim();
    if (!query) return;

    currentQuery = query;
    currentPage = page;

    movieList.innerHTML = "";
    loader.classList.remove("hidden");

    const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${query}&page=${page}`);
    const data = await res.json();

    loader.classList.add("hidden");

    if (data.Response === "False") {
        movieList.innerHTML = "<p>No results.</p>";
        pagination.classList.add("hidden");
        return;
    }

    displayMovies(data.Search);

    pagination.classList.remove("hidden");
    pageNumber.textContent = `Page ${page}`;
    prevBtn.disabled = page === 1;
    nextBtn.disabled = data.totalResults <= page * 10;
}

prevBtn.addEventListener("click", () => searchMovies(currentPage - 1));
nextBtn.addEventListener("click", () => searchMovies(currentPage + 1));

/* ------------------------------------
   DISPLAY MOVIES
------------------------------------ */
function displayMovies(movies) {
    movieList.innerHTML = "";

    movies.forEach(m => {
        const el = document.createElement("div");
        el.classList.add("movie");
        el.innerHTML = `
            <img src="${m.Poster !== "N/A" ? m.Poster : "placeholder.png"}">
            <div class="movie-info">
                <h3>${m.Title}</h3>
                <p>${m.Year}</p>
                <button class="favBtn">❤️ Favorite</button>
            </div>
        `;

        el.querySelector(".favBtn").addEventListener("click", () => addFavorite(m));

        el.addEventListener("click", e => {
            if (e.target.classList.contains("favBtn")) return;
            getMovieDetails(m.imdbID);
        });

        movieList.appendChild(el);
    });
}

/* ------------------------------------
   FAVORITES (LOCALSTORAGE)
------------------------------------ */
function addFavorite(movie) {
    let favs = JSON.parse(localStorage.getItem("favorites") || "[]");

    if (favs.some(m => m.imdbID === movie.imdbID)) return;

    favs.push(movie);
    localStorage.setItem("favorites", JSON.stringify(favs));
    loadFavorites();
}

function loadFavorites() {
    let favs = JSON.parse(localStorage.getItem("favorites") || "[]");
    favoritesList.innerHTML = "";

    favs.forEach(m => {
        const el = document.createElement("div");
        el.classList.add("movie");

        el.innerHTML = `
            <img src="${m.Poster !== "N/A" ? m.Poster : "placeholder.png"}">
            <div class="movie-info">
                <h3>${m.Title}</h3>
                <button class="removeBtn">Remove</button>
            </div>
        `;

        el.querySelector(".removeBtn").addEventListener("click", () => {
            removeFavorite(m.imdbID);
        });

        favoritesList.appendChild(el);
    });
}

function removeFavorite(id) {
    let favs = JSON.parse(localStorage.getItem("favorites") || "[]");
    favs = favs.filter(m => m.imdbID !== id);
    localStorage.setItem("favorites", JSON.stringify(favs));
    loadFavorites();
}

loadFavorites();

/* ------------------------------------
   MOVIE DETAILS MODAL
------------------------------------ */
async function getMovieDetails(id) {
    const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}&plot=full`);
    const movie = await res.json();

    movieDetails.innerHTML = `
        <h2>${movie.Title} (${movie.Year})</h2>
        <p><strong>Genre:</strong> ${movie.Genre}</p>
        <p><strong>Director:</strong> ${movie.Director}</p>
        <p><strong>Cast:</strong> ${movie.Actors}</p>
        <p><strong>Plot:</strong> ${movie.Plot}</p>
        <img src="${movie.Poster}" style="width:200px;margin-top:10px;">
    `;

    movieModal.classList.remove("hidden");
}

closeModal.addEventListener("click", () => {
    movieModal.classList.add("hidden");
});