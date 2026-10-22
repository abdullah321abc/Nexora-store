console.log("NEXORA SCRIPT CONNECTED!");
/* ==========================================
   NEXORA STORE — MAIN JAVASCRIPT
   The Future of Apps.
========================================== */

"use strict";

// Run after the HTML has loaded.
document.addEventListener("DOMContentLoaded", () => {
    setCurrentYear();
    setupSearch();
    setupGameFilters();
    setupLoginForm();
});
function setupSignupForm() {
    const form = document.getElementById("signupForm");
    if (!form) return;

    const message = document.getElementById("signupMessage");
    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        console.log("Nexora signup handler triggered");

        // Check that Supabase is initialized.
        if (
            typeof supabaseClient === "undefined" ||
            !supabaseClient
        ) {
            showMessage(
                message,
                "Supabase is not connected. Check your URL, key, and CDN.",
                "error"
            );
            return;
        }

        const username = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const acceptedTerms = document.getElementById("acceptTerms").checked;

        if (password !== confirmPassword) {
            showMessage(message, "Passwords do not match.", "error");
            return;
        }

        if (password.length < 8) {
            showMessage(message, "Password must be at least 8 characters.", "error");
            return;
        }

        if (!acceptedTerms) {
            showMessage(message, "Please accept the terms and conditions.", "error");
            return;
        }

        if (submitButton) submitButton.disabled = true;

        showMessage(message, "Creating your account...", "");

        try {
            const { data, error } =
                await supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: { username: username }
                    }
                });

            if (error) throw error;

            if (data.session) {
                showMessage(
                    message,
                    "Account created! Redirecting to your profile...",
                    "success"
                );

                window.location.href = "profile.html";
            } else {
                showMessage(
                    message,
                    "Signup received. Check your email to confirm your account.",
                    "success"
                );
            }
        } catch (error) {
            console.error("Signup error:", error);

            showMessage(
                message,
                "Signup failed: " + error.message,
                "error"
            );
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}


/* ==========================================
   1. AUTOMATIC COPYRIGHT YEAR
========================================== */

function setCurrentYear() {
    const yearElement = document.getElementById("currentYear");

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}


/* ==========================================
   2. SEARCH GAMES
========================================== */

function setupSearch() {
    const searchForms = document.querySelectorAll("#searchForm");

    searchForms.forEach((form) => {
        const input = form.querySelector("#searchInput");

        if (!input) return;

        // If the form is submitted, open the search page.
        form.addEventListener("submit", (event) => {
            event.preventDefault();

            const query = input.value.trim();

            if (!query) {
                input.focus();
                return;
            }

            const searchUrl = new URL("search.html", window.location.href);
            searchUrl.searchParams.set("q", query);

            // From the homepage, search.html is inside pages/.
            if (
                window.location.pathname.endsWith("/index.html") ||
                window.location.pathname.endsWith("/")
            ) {
                searchUrl.pathname = new URL(
                    "pages/search.html",
                    window.location.href
                ).pathname;
            }

            window.location.href = searchUrl.href;
        });

        // Allow instant filtering on the search page.
        input.addEventListener("input", () => {
            if (document.getElementById("gamesGrid")) {
                filterGames(input.value, getSelectedPlatform());
            }
        });
    });

    // Read the search query from the URL.
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");

    if (query) {
        const searchInput = document.getElementById("searchInput");

        if (searchInput) {
            searchInput.value = query;
        }

        filterGames(query, getSelectedPlatform());
    }
}


/* ==========================================
   3. GAME SEARCH AND PLATFORM FILTERS
========================================== */

function getSelectedPlatform() {
    const selectedButton = document.querySelector(
        ".filter-button[aria-pressed='true']"
    );

    return selectedButton?.dataset.filter || "all";
}

function filterGames(searchText = "", platform = "all") {
    const cards = document.querySelectorAll(
        "#gamesGrid .game-item, #gamesGrid .game-card"
    );

    let visibleCount = 0;
    const query = searchText.toLowerCase().trim();

    cards.forEach((card) => {
        const title = (
            card.dataset.title ||
            card.querySelector("h3")?.textContent ||
            ""
        ).toLowerCase();

        const description = card.textContent.toLowerCase();

        const platforms = (
            card.dataset.platform || ""
        ).toLowerCase().split(/\s+/);

        const matchesSearch =
            !query ||
            title.includes(query) ||
            description.includes(query);

        const matchesPlatform =
            platform === "all" ||
            platforms.includes(platform);

        const visible = matchesSearch && matchesPlatform;

        card.hidden = !visible;

        if (visible) {
            visibleCount++;
        }
    });

    const countElement = document.getElementById("resultsCount");

    if (countElement) {
        countElement.textContent =
            `${visibleCount} game${visibleCount === 1 ? "" : "s"} found`;
    }

    const emptyMessage = document.getElementById("emptyMessage");

    if (emptyMessage) {
        emptyMessage.hidden = visibleCount !== 0;
    }

    const titleElement = document.getElementById("resultsTitle");

    if (titleElement) {
        titleElement.textContent = query
            ? `Results for "${searchText.trim()}"`
            : platform === "all"
                ? "Explore Games"
                : "Filtered Games";
    }
}

function setupGameFilters() {
    const filterButtons = document.querySelectorAll(".filter-button");

    if (!filterButtons.length) return;

    const params = new URLSearchParams(window.location.search);
    const requestedPlatform = params.get("platform");

    // Set a filter from links such as games.html?platform=android.
    if (requestedPlatform) {
        const matchingButton = [...filterButtons].find(
            (button) => button.dataset.filter === requestedPlatform
        );

        if (matchingButton) {
            filterButtons.forEach((button) => {
                button.setAttribute("aria-pressed", "false");
            });

            matchingButton.setAttribute("aria-pressed", "true");
        }
    }

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            filterButtons.forEach((item) => {
                item.setAttribute("aria-pressed", "false");
            });

            button.setAttribute("aria-pressed", "true");

            const searchInput = document.getElementById("searchInput");

            filterGames(
                searchInput?.value || "",
                button.dataset.filter || "all"
            );
        });
    });

    const searchInput = document.getElementById("searchInput");

    filterGames(
        searchInput?.value || "",
        getSelectedPlatform()
    );
}


/* ==========================================
   4. FORM MESSAGE HELPER
========================================== */

function showMessage(element, message, type = "") {
    if (!element) return;

    element.textContent = message;
    element.classList.remove("success", "error");

    if (type) {
        element.classList.add(type);
    }
}


/* ==========================================
   5. LOGIN FORM
   Demo validation only — not real authentication.
========================================== */

function setupLoginForm() {
    const form = document.getElementById("loginForm");

    if (!form) return;

    const message = document.getElementById("loginMessage");

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const email = document
            .getElementById("loginEmail")
            ?.value.trim();

        const password = document
            .getElementById("loginPassword")
            ?.value;

        if (!email || !password) {
            showMessage(
                message,
                "Please enter your email and password.",
                "error"
            );
            return;
        }

        showMessage(
            message,
            "The form works, but real login needs Supabase authentication.",
            "error"
        );
    });
}



/* REAL SUPABASE SIGNUP */
function setupSignupForm() {
    const form = document.getElementById("signupForm");
    if (!form) return;

    const message = document.getElementById("signupMessage");
    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!supabaseClient) {
            showMessage(
                message,
                "Supabase is not configured. Check your project URL, publishable key, and CDN.",
                "error"
            );
            return;
        }

        const username = document
            .getElementById("signupName").value.trim();

        const email = document
            .getElementById("signupEmail").value.trim();

        const password = document
            .getElementById("signupPassword").value;

        const confirmPassword = document
            .getElementById("confirmPassword").value;

        const terms = document
            .getElementById("acceptTerms").checked;

        if (username.length < 3) {
            showMessage(message, "Username must have at least 3 characters.", "error");
            return;
        }

        if (password.length < 8) {
            showMessage(message, "Password must have at least 8 characters.", "error");
            return;
        }

        if (password !== confirmPassword) {
            showMessage(message, "Passwords do not match.", "error");
            return;
        }

        if (!terms) {
            showMessage(message, "Please accept the terms and conditions.", "error");
            return;
        }

        if (submitButton) submitButton.disabled = true;

        showMessage(message, "Creating your account...", "");

        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username
                    }
                }
            });

            if (error) throw error;

            if (data.session) {
                showMessage(
                    message,
                    "Account created successfully! Opening your profile...",
                    "success"
                );

                window.location.href = "profile.html";
            } else {
                showMessage(
                    message,
                    "Signup received! Check your email for a confirmation link before logging in.",
                    "success"
                );
            }
        } catch (error) {
            console.error("Supabase signup error:", error);

            showMessage(
                message,
                error.message || "Signup failed. Please try again.",
                "error"
            );
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}


/* ==========================================
   7. UPLOAD GAME FORM
   Demo validation only — files are not uploaded.
========================================== */

function setupUploadForm() {
    const form = document.getElementById("uploadForm");

    if (!form) return;

    const message = document.getElementById("uploadMessage");

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const gameName = document
            .getElementById("gameName")
            ?.value.trim();

        const developerName = document
            .getElementById("developerName")
            ?.value.trim();

        const description = document
            .getElementById("gameDescription")
            ?.value.trim();

        const platform = document
            .getElementById("gamePlatform")
            ?.value;

        const gameType = document
            .getElementById("gameType")
            ?.value;

        const coverInput = document.getElementById("gameCover");
        const gameInput = document.getElementById("gameFile");

        const ownership = document
            .getElementById("ownershipConfirm")?.checked;

        const safety = document
            .getElementById("safetyConfirm")?.checked;

        if (
            !gameName ||
            !developerName ||
            !description ||
            !platform ||
            !gameType
        ) {
            showMessage(
                message,
                "Please complete all game details.",
                "error"
            );
            return;
        }

        if (!coverInput?.files?.length || !gameInput?.files?.length) {
            showMessage(
                message,
                "Please select both a cover image and a game file.",
                "error"
            );
            return;
        }

        const cover = coverInput.files[0];
        const gameFile = gameInput.files[0];

        const allowedImages = [
            "image/png",
            "image/jpeg",
            "image/webp"
        ];

        if (!allowedImages.includes(cover.type)) {
            showMessage(
                message,
                "Please choose a PNG, JPG, or WebP cover image.",
                "error"
            );
            return;
        }

        const extension = gameFile.name
            .split(".")
            .pop()
            .toLowerCase();

        const allowedExtensions = [
            "html", "htm", "zip", "apk", "exe"
        ];

        if (!allowedExtensions.includes(extension)) {
            showMessage(
                message,
                "This game file format is not supported by the form.",
                "error"
            );
            return;
        }

        if (!ownership || !safety) {
            showMessage(
                message,
                "Please confirm ownership and the review requirements.",
                "error"
            );
            return;
        }

        showMessage(
            message,
            "Your form passed basic checks, but nothing has been uploaded. A secure backend and review process are needed to submit the game.",
            "error"
        );
    });
}


/* ==========================================
   8. PROFILE PAGE
   Displays a guest profile for now.
========================================== */

function setupProfile() {
    const editButton = document.getElementById("editProfileButton");
    const message = document.getElementById("profileMessage");

    if (editButton) {
        editButton.addEventListener("click", () => {
            showMessage(
                message,
                "Profile editing will be available after account storage is connected.",
                "error"
            );
        });
    }

    // Keep demo statistics at zero until real data exists.
    const savedCount = document.getElementById("savedGamesCount");
    const uploadedCount = document.getElementById("uploadedGamesCount");
    const playedCount = document.getElementById("playedGamesCount");

    if (savedCount) savedCount.textContent = "0";
    if (uploadedCount) uploadedCount.textContent = "0";
    if (playedCount) playedCount.textContent = "0";
}


/* ==========================================
   9. ACTIVE MOBILE NAVIGATION
========================================== */

function setupActiveNavigation() {
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll(".bottom-nav .nav-item");

    navItems.forEach((item) => {
        const href = item.getAttribute("href");

        if (!href) return;

        const linkPath = new URL(href, window.location.href).pathname;

        if (linkPath === currentPath) {
            item.classList.add("active");
            item.setAttribute("aria-current", "page");
        } else {
            item.classList.remove("active");
            item.removeAttribute("aria-current");
        }
    });
}




/* SUPABASE CONFIGURATION */
const SUPABASE_URL = "https://hkbcrmcwrwusbpwrtqym.supabase.co/rest/v1/";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_prYKpzVTuAh_WVNwpVNscw_pIR3NI7Y";

const supabaseClient =
    window.supabase &&
    SUPABASE_URL !== "https://hkbcrmcwrwusbpwrtqym.supabase.co/rest/v1/" &&
    SUPABASE_PUBLISHABLE_KEY !== "sb_publishable_prYKpzVTuAh_WVNwpVNscw_pIR3NI7Y"
        ? window.supabase.createClient(
              SUPABASE_URL,
              SUPABASE_PUBLISHABLE_KEY
          )
        : null;
