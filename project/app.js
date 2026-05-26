"use strict";

const GAMES_URL = "./movies.json";
let allGames = [];

const gameList = document.querySelector("#movie-list");
const genreSelect = document.querySelector("#genre-select");
const playersSelect = document.querySelector("#players-select");
const ageSelect = document.querySelector("#age-select");
const difficultySelect = document.querySelector("#difficulty-select");
const playtimeSelect = document.querySelector("#playtime-select");
const searchInput = document.querySelector("#search-input");
const sortSelect = document.querySelector("#sort-select");
const gameCount = document.querySelector("#movie-count");
const dialog = document.querySelector("#movie-dialog");

fetchGames();

async function fetchGames() {
  try {
    const response = await fetch(GAMES_URL);
    allGames = await response.json();

    populateGenreSelect();
    populatePlayersSelect();
    populateAgeSelect();

    applyFiltersAndSort();
  } catch (error) {
    gameList.innerHTML = `<p class="empty">Kunne ikke loade spil.</p>`;
    console.error(error);
  }
}

function populateGenreSelect() {
  const genres = [...new Set(allGames.map(game => game.genre))]
    .sort((a, b) => a.localeCompare(b));

  for (const genre of genres) {
    genreSelect.insertAdjacentHTML(
      "beforeend",
      `<option value="${genre}">${genre}</option>`
    );
  }
}

function populatePlayersSelect() {
  const maxPlayers = Math.max(...allGames.map(game => game.players.max));

  for (let i = 1; i <= maxPlayers; i++) {
    const text = i === 1 ? "1 spiller" : `${i} spillere`;

    playersSelect.insertAdjacentHTML(
      "beforeend",
      `<option value="${i}">${text}</option>`
    );
  }
}

function populateAgeSelect() {
  const ages = [...new Set(allGames.map(game => game.age))]
    .sort((a, b) => a - b);

  for (const age of ages) {
    ageSelect.insertAdjacentHTML(
      "beforeend",
      `<option value="${age}">${age}+ år</option>`
    );
  }
}

function matchesPlaytime(game, selectedPlaytime) {
  if (selectedPlaytime === "all") return true;

  const playtime = game.playtime;

  if (selectedPlaytime === "0-30") {
    return playtime <= 30;
  }

  if (selectedPlaytime === "31-60") {
    return playtime >= 31 && playtime <= 60;
  }

  if (selectedPlaytime === "61-90") {
    return playtime >= 61 && playtime <= 90;
  }

  if (selectedPlaytime === "91+") {
    return playtime > 90;
  }

  return true;
}

function applyFiltersAndSort() {
  const selectedGenre = genreSelect.value;
  const selectedPlayers = playersSelect.value;
  const selectedAge = ageSelect.value;
  const selectedDifficulty = difficultySelect.value;
  const selectedPlaytime = playtimeSelect.value;
  const searchValue = searchInput.value.trim().toLowerCase();
  const sortOption = sortSelect.value;

  let filtered = allGames.filter(game => {
    const searchText = [
      game.title,
      game.genre,
      game.description,
      game.longDescription,
      game.difficulty
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesGenre =
      selectedGenre === "all" ||
      game.genre === selectedGenre;

    const matchesPlayers =
      selectedPlayers === "all" ||
      (
        Number(selectedPlayers) >= game.players.min &&
        Number(selectedPlayers) <= game.players.max
      );

    const matchesAge =
      selectedAge === "all" ||
      game.age <= Number(selectedAge);

    const matchesDifficulty =
      selectedDifficulty === "all" ||
      game.difficulty === selectedDifficulty;

    const matchesSearch =
      searchText.includes(searchValue);

    return (
      matchesGenre &&
      matchesPlayers &&
      matchesAge &&
      matchesDifficulty &&
      matchesPlaytime(game, selectedPlaytime) &&
      matchesSearch
    );
  });

  const difficultyRank = {
    "Let": 1,
    "Mellem": 2,
    "Svær": 3
  };

  const sorters = {
    "title-asc":       (a, b) => a.title.localeCompare(b.title),
    "title-desc":      (a, b) => b.title.localeCompare(a.title),
    "rating-desc":     (a, b) => b.rating - a.rating,
    "rating-asc":      (a, b) => a.rating - b.rating,
    "playtime-asc":    (a, b) => a.playtime - b.playtime,
    "playtime-desc":   (a, b) => b.playtime - a.playtime,
    "players-asc":     (a, b) => a.players.max - b.players.max,
    "players-desc":    (a, b) => b.players.max - a.players.max,
    "age-asc":         (a, b) => a.age - b.age,
    "age-desc":        (a, b) => b.age - a.age,
    "votes-desc":      (a, b) => b.votes - a.votes,
    "difficulty-asc":  (a, b) => (difficultyRank[a.difficulty] || 0) - (difficultyRank[b.difficulty] || 0),
    "difficulty-desc": (a, b) => (difficultyRank[b.difficulty] || 0) - (difficultyRank[a.difficulty] || 0)
  };

  if (sorters[sortOption]) {
    filtered.sort(sorters[sortOption]);
  }

  showGames(filtered);
}

function showGames(games) {
  gameList.innerHTML = "";
  gameCount.textContent = `Viser ${games.length} ud af ${allGames.length} spil`;

  if (games.length === 0) {
    gameList.innerHTML = '<p class="empty">Ingen spil matcher din søgning.</p>';
    return;
  }

  for (const game of games) showGame(game);
}

function toggleStar(game) {
  game._starred = !game._starred;
  game.votes += game._starred ? 1 : -1;
}

function updateCardBadge(game) {
  const card = gameList.querySelector(`[data-title="${CSS.escape(game.title)}"]`);
  if (!card) return;
  const badge = card.querySelector(".rating-badge");
  badge.classList.toggle("starred", game._starred);
  badge.querySelector(".rating-votes").textContent = `(${game.votes})`;
}

function showGame(game) {
  const starredClass = game._starred ? "starred" : "";
  const html = `
    <article class="movie-card" data-title="${game.title}">
      <img src="${game.image}" alt="${game.title}" class="movie-poster" />
      <div class="movie-info">
        <div class="title-row">
          <h2>${game.title}</h2>
          <span class="rating-badge ${starredClass}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            ${game.rating} <span class="rating-votes">(${game.votes})</span>
          </span>
        </div>
        <p class="card-description">${game.description}</p>
        <div class="info-badges">
          <span class="badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${game.playtime} min.
          </span>
          <span class="badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            ${game.players.min === game.players.max ? game.players.max : game.players.min + "-" + game.players.max} spillere
          </span>
          <span class="badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ${game.age}+
          </span>
        </div>
      </div>
    </article>
  `;

  gameList.insertAdjacentHTML("beforeend", html);
  const newCard = gameList.lastElementChild;
  const ratingBadge = newCard.querySelector(".rating-badge");

  ratingBadge.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleStar(game);
    ratingBadge.classList.toggle("starred", game._starred);
    ratingBadge.querySelector(".rating-votes").textContent = `(${game.votes})`;
  });

  newCard.addEventListener("click", () => showGameDialog(game));
}

function showGameDialog(game) {
  const dialogContent = document.querySelector("#dialog-content");
  const players = game.players.min === game.players.max
    ? game.players.max
    : `${game.players.min}–${game.players.max}`;

  dialogContent.innerHTML = `
    <img src="${game.image}" alt="${game.title}" class="movie-poster">
    <div class="dialog-details">
      <div class="dialog-title-row">
        <h2>${game.title}</h2>
        <span class="dialog-genre">${game.genre}</span>
      </div>

      <div class="dialog-rating">
        <button type="button" class="dialog-star-btn ${game._starred ? 'starred' : ''}" aria-label="Stjerne spil">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </button>
        <span class="dialog-score">${game.rating}</span>
        <span class="dialog-votes">(${game.votes} anmeldelser)</span>
      </div>

      <div class="dialog-stats">
        <div class="dialog-stat">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <div><span class="stat-label">Spillere</span><span class="stat-value">${players}</span></div>
        </div>
        <div class="dialog-stat">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <div><span class="stat-label">Spilletid</span><span class="stat-value">${game.playtime} min</span></div>
        </div>
        <div class="dialog-stat">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <div><span class="stat-label">Alder</span><span class="stat-value">${game.age}+</span></div>
        </div>
      </div>

      <p class="movie-description">${game.longDescription || game.description}</p>

      
    </div>
  `;

  const starBtn = dialogContent.querySelector(".dialog-star-btn");
  const votesEl = dialogContent.querySelector(".dialog-votes");

  starBtn.addEventListener("click", () => {
    toggleStar(game);
    starBtn.classList.toggle("starred", game._starred);
    votesEl.textContent = `(${game.votes} anmeldelser)`;
    updateCardBadge(game);
  });

  dialog.showModal();
}

// Close game dialog by clicking the backdrop
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) dialog.close();
});

// ── Booking ──────────────────────────────────────────
const bookingDialog = document.querySelector("#booking-dialog");
const bookingForm   = document.querySelector("#booking-form");
const originalBookingBody = document.querySelector(".booking-body").innerHTML;

function openBookingDialog(gameTitle = "") {
  bookingForm.reset();
  document.querySelector(".booking-body").innerHTML = originalBookingBody;
  document.querySelector("#booking-date").min = new Date().toISOString().split("T")[0];
  if (gameTitle) {
    document.querySelector("#booking-note").value = `Jeg vil gerne spille ${gameTitle}`;
  }
  bookingDialog.showModal();
}

document.querySelector("#close-booking").addEventListener("click", () => {
  bookingDialog.close();
});

bookingDialog.addEventListener("click", (e) => {
  if (e.target === bookingDialog) bookingDialog.close();
});

bookingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name     = document.querySelector("#booking-name").value;
  const date     = document.querySelector("#booking-date").value;
  const time     = document.querySelector("#booking-time").value;
  const people   = document.querySelector("#booking-people").value;
  const location = document.querySelector("#booking-location").value;

  const formatted = new Date(date).toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" });

  document.querySelector(".booking-body").innerHTML = `
    <div class="booking-success">
      <div class="success-icon">✓</div>
      <h3>Booking bekræftet!</h3>
      <p>Hej <strong>${name}</strong> – vi glæder os til at se dig!</p>
      <p style="margin-top:0.5rem">
        <strong>${formatted}</strong> kl. <strong>${time}</strong><br>
        ${people} ${people == 1 ? "person" : "personer"} · ${location}
      </p>
      <p style="margin-top:0.75rem;font-size:0.8rem">En bekræftelse er sendt til din email.</p>
    </div>
  `;
});

const resetFilters = document.querySelector("#reset-filters");

resetFilters.addEventListener("click", () => {
  genreSelect.value = "all";
  playersSelect.value = "all";
  ageSelect.value = "all";
  difficultySelect.value = "all";
  playtimeSelect.value = "all";
  sortSelect.value = "none";
  searchInput.value = "";

  applyFiltersAndSort();
});

genreSelect.addEventListener("change", applyFiltersAndSort);
playersSelect.addEventListener("change", applyFiltersAndSort);
ageSelect.addEventListener("change", applyFiltersAndSort);
difficultySelect.addEventListener("change", applyFiltersAndSort);
playtimeSelect.addEventListener("change", applyFiltersAndSort);
searchInput.addEventListener("input", applyFiltersAndSort);
sortSelect.addEventListener("change", applyFiltersAndSort);


const backToTopButton = document.querySelector("#back-to-top");

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    backToTopButton.classList.add("show");
  } else {
    backToTopButton.classList.remove("show");
  }
});

backToTopButton.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

document.querySelector("#open-booking").addEventListener("click", () => {
  openBookingDialog();
});