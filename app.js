// Constants
const API_KEY = AIzaSyD9JUUiPiAJRz6oGLzSRqssb-1yGfJRTDA;
const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

// Featured Books (Enhanced with more details)
const FEATURED_BOOKS = [
  {
    id: 'featured1',
    title: 'The Midnight Library',
    authors: ['Matt Haig'],
    description: 'Between life and death there is a library, and within that library, the shelves go on forever...',
    thumbnail: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
    categories: ['Fiction', 'Fantasy'],
    pageCount: 304,
    publishedDate: '2020-08-13',
    averageRating: 4.5
  },
  {
    id: 'featured2',
    title: 'Atomic Habits',
    authors: ['James Clear'],
    description: 'Tiny Changes, Remarkable Results: An Easy & Proven Way to Build Good Habits & Break Bad Ones',
    thumbnail: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500',
    categories: ['Self-Help', 'Personal Development'],
    pageCount: 320,
    publishedDate: '2018-10-16',
    averageRating: 4.8
  },
  {
    id: 'featured3',
    title: 'Project Hail Mary',
    authors: ['Andy Weir'],
    description: 'A lone astronaut must save humanity from a looming extinction event...',
    thumbnail: 'https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?w=500',
    categories: ['Science Fiction'],
    pageCount: 496,
    publishedDate: '2021-05-04',
    averageRating: 4.7
  }
];

// DOM Elements
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const libraryBooks = document.getElementById('library-books');
const loadingSpinner = document.getElementById('loading');
const emptyLibrary = document.getElementById('empty-library');
const bookCardTemplate = document.getElementById('book-card-template');
const featuredBooksGrid = document.querySelector('#featured-books .book-grid');
const themeToggle = document.getElementById('theme-toggle');
const streakCount = document.getElementById('streak-count');
const daysGrid = document.querySelector('.days-grid');
const readingStats = document.getElementById('reading-stats');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeLucideIcons();
  renderLibrary();
  setupEventListeners();
  loadTheme();
  loadStreak();
  displayFeaturedBooks();
  updateStreakUI();
  updateReadingStats();
});

// Event Listeners Setup
function setupEventListeners() {
  // Search form submission
  searchForm.addEventListener('submit', handleSearch);

  // Theme toggle
  themeToggle.addEventListener('click', toggleTheme);

  // Tab navigation
  document.querySelectorAll('.nav-button').forEach(button => {
    button.addEventListener('click', () => handleTabChange(button));
  });

  // Shelf filters
  document.querySelectorAll('.shelf-button').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelector('.shelf-button.active').classList.remove('active');
      button.classList.add('active');
      filterLibrary();
    });
  });

  // Filter and sort controls
  document.getElementById('status-filter').addEventListener('change', filterLibrary);
  document.getElementById('genre-filter').addEventListener('change', filterLibrary);
  document.getElementById('sort-by').addEventListener('change', filterLibrary);
}

// Library Management
function renderLibrary() {
  const library = getLibrary();
  libraryBooks.innerHTML = '';
  
  if (library.length === 0) {
    emptyLibrary.classList.remove('hidden');
    return;
  }

  emptyLibrary.classList.add('hidden');
  library.forEach(book => {
    const card = createBookCard(book, true);
    libraryBooks.appendChild(card);
  });

  initializeLucideIcons();
}

function filterLibrary() {
  const statusFilter = document.getElementById('status-filter').value;
  const genreFilter = document.getElementById('genre-filter').value;
  const sortBy = document.getElementById('sort-by').value;
  
  let library = getLibrary();

  // Apply filters
  if (statusFilter !== 'all') {
    library = library.filter(book => book.status === statusFilter);
  }

  if (genreFilter !== 'all') {
    library = library.filter(book => 
      book.categories && book.categories.some(cat => 
        cat.toLowerCase().includes(genreFilter.toLowerCase())
      )
    );
  }

  // Apply sorting
  library.sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'author':
        return a.authors[0].localeCompare(b.authors[0]);
      case 'progress':
        return b.progress - a.progress;
      case 'rating':
        return (b.averageRating || 0) - (a.averageRating || 0);
      default: // date-added
        return new Date(b.dateAdded) - new Date(a.dateAdded);
    }
  });

  // Render filtered and sorted library
  libraryBooks.innerHTML = '';
  library.forEach(book => {
    const card = createBookCard(book, true);
    libraryBooks.appendChild(card);
  });

  initializeLucideIcons();
}

// Display Featured Books
function displayFeaturedBooks() {
  featuredBooksGrid.innerHTML = '';
  FEATURED_BOOKS.forEach(book => {
    const card = createBookCard(book);
    featuredBooksGrid.appendChild(card);
  });
  initializeLucideIcons();
}

// Search Books
async function searchBooks(query) {
  const response = await fetch(
    `${BASE_URL}?q=${encodeURIComponent(query)}&key=${API_KEY}&maxResults=20`
  );
  const data = await response.json();
  
  if (!data.items) return [];

  return data.items.map(item => ({
    id: item.id,
    title: item.volumeInfo.title,
    authors: item.volumeInfo.authors || ['Unknown Author'],
    description: item.volumeInfo.description || 'No description available',
    thumbnail: item.volumeInfo.imageLinks?.thumbnail || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500',
    categories: item.volumeInfo.categories || [],
    pageCount: item.volumeInfo.pageCount,
    publishedDate: item.volumeInfo.publishedDate,
    averageRating: item.volumeInfo.averageRating
  }));
}

// Theme Management
function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// Streak Management with Enhanced Logic
function loadStreak() {
  const streak = JSON.parse(localStorage.getItem('readingStreak')) || {
    count: 0,
    lastRead: null,
    history: [],
    totalPagesRead: 0,
    booksCompleted: 0,
    longestStreak: 0
  };
  
  const today = new Date().toDateString();
  const lastRead = streak.lastRead ? new Date(streak.lastRead).toDateString() : null;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  if (lastRead !== today && lastRead !== yesterday) {
    streak.count = 0;
  }
  
  if (streak.count > streak.longestStreak) {
    streak.longestStreak = streak.count;
  }
  
  localStorage.setItem('readingStreak', JSON.stringify(streak));
  return streak;
}

function updateStreak(pagesRead = 10) {
  const streak = loadStreak();
  const today = new Date().toDateString();
  
  if (streak.lastRead !== today) {
    streak.count++;
    streak.lastRead = today;
    streak.history.push(today);
    streak.totalPagesRead += pagesRead;
    
    if (streak.count > streak.longestStreak) {
      streak.longestStreak = streak.count;
    }
    
    // Keep only last 30 days
    if (streak.history.length > 30) {
      streak.history.shift();
    }
    
    localStorage.setItem('readingStreak', JSON.stringify(streak));
    updateStreakUI();
    updateReadingStats();
    
    const milestone = getMilestoneMessage(streak.count);
    if (milestone) {
      showNotification(milestone, 'success');
    } else {
      showNotification(`🔥 ${streak.count} day streak! Keep it up!`, 'success');
    }
  }
}

function getMilestoneMessage(streakCount) {
  const milestones = {
    7: '🎉 One week streak! Amazing dedication!',
    30: '🏆 One month streak! You\'re unstoppable!',
    50: '⭐ Fifty days! You\'re a reading champion!',
    100: '🌟 Incredible! 100 days of consistent reading!',
    365: '👑 One year streak! You\'re legendary!'
  };
  return milestones[streakCount];
}

function updateStreakUI() {
  const streak = loadStreak();
  streakCount.textContent = streak.count;
  
  // Update days grid with enhanced visual feedback
  daysGrid.innerHTML = '';
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    const dateString = date.toDateString();
    const wasRead = streak.history.includes(dateString);
    
    const dayEl = document.createElement('div');
    dayEl.className = `day ${wasRead ? 'read' : ''}`;
    dayEl.innerHTML = `
      <div class="day-marker ${wasRead ? 'active' : ''}" 
           title="${wasRead ? 'Read on ' : 'No reading on '}${date.toLocaleDateString()}">
      </div>
      <span class="day-label">${date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
    `;
    daysGrid.appendChild(dayEl);
  }
}

function updateReadingStats() {
  const streak = loadStreak();
  const library = getLibrary();
  const completedBooks = library.filter(book => book.status === 'completed').length;
  
  readingStats.innerHTML = `
    <div class="stat">
      <span class="stat-value">${streak.longestStreak}</span>
      <span class="stat-label">Longest Streak</span>
    </div>
    <div class="stat">
      <span class="stat-value">${streak.totalPagesRead}</span>
      <span class="stat-label">Pages Read</span>
    </div>
    <div class="stat">
      <span class="stat-value">${completedBooks}</span>
      <span class="stat-label">Books Completed</span>
    </div>
  `;
}

// Event Handlers with Enhanced Features
async function handleSearch(e) {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;

  searchResults.innerHTML = '';
  loadingSpinner.classList.remove('hidden');
  featuredBooksGrid.parentElement.classList.add('hidden');

  try {
    const books = await searchBooks(query);
    if (books.length === 0) {
      searchResults.innerHTML = `
        <div class="empty-search">
          <i data-lucide="search-x" class="empty-icon"></i>
          <h3>No books found</h3>
          <p>Try different keywords or check the spelling</p>
        </div>
      `;
    } else {
      books.forEach(book => {
        searchResults.appendChild(createBookCard(book));
      });
    }
  } catch (error) {
    showNotification('Failed to fetch books. Please try again.', 'error');
  } finally {
    loadingSpinner.classList.add('hidden');
    initializeLucideIcons();
  }
}

function handleTabChange(button) {
  const tabId = button.dataset.tab;
  
  // Remove active class from all nav buttons and add to clicked button
  document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');

  // Hide all tab content
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  
  // Show selected tab content
  const selectedTab = document.getElementById(`${tabId}-tab`);
  if (selectedTab) {
    selectedTab.classList.add('active');
    
    if (tabId === 'library') {
      renderLibrary();
      updateReadingStats();
      featuredBooksGrid.parentElement.classList.add('hidden');
    } else {
      featuredBooksGrid.parentElement.classList.remove('hidden');
      searchResults.innerHTML = '';
    }
  }
}

// Enhanced Book Card Creation
function createBookCard(book, isLibraryBook = false) {
  const template = bookCardTemplate.content.cloneNode(true);
  const card = template.querySelector('.book-card');

  const coverImage = card.querySelector('.cover-image');
  coverImage.src = book.thumbnail;
  coverImage.alt = `Cover of ${book.title}`;

  card.querySelector('.book-title').textContent = book.title;
  card.querySelector('.book-authors').textContent = book.authors.join(', ');

  // Add book details
  const detailsSection = document.createElement('div');
  detailsSection.className = 'book-details';
  detailsSection.innerHTML = `
    ${book.pageCount ? `<span class="detail"><i data-lucide="book-open"></i>${book.pageCount} pages</span>` : ''}
    ${book.publishedDate ? `<span class="detail"><i data-lucide="calendar"></i>${new Date(book.publishedDate).getFullYear()}</span>` : ''}
    ${book.averageRating ? `<span class="detail"><i data-lucide="star"></i>${book.averageRating.toFixed(1)}</span>` : ''}
  `;
  card.querySelector('.book-info').appendChild(detailsSection);

  if (isLibraryBook) {
    setupLibraryBookCard(card, book);
  } else {
    setupSearchBookCard(card, book);
  }

  return card;
}

// Enhanced Library Book Card Setup
function setupLibraryBookCard(card, book) {
  const progressOverlay = card.querySelector('.progress-overlay');
  progressOverlay.classList.remove('hidden');
  
  const progressFill = card.querySelector('.progress-fill');
  const progressText = card.querySelector('.progress-text');
  
  progressFill.style.width = `${book.progress}%`;
  progressText.textContent = `${book.progress}%`;

  // Add reading status badge
  const statusBadge = document.createElement('div');
  statusBadge.className = `status-badge ${book.status}`;
  statusBadge.textContent = book.status.replace('-', ' ');
  card.querySelector('.book-cover').appendChild(statusBadge);

  // Add mark as read button with page count
  const markReadButton = card.querySelector('.mark-read-button');
  markReadButton.innerHTML = `
    <i data-lucide="book-open"></i>
    Read ${Math.min(10, book.pageCount || 10)} pages
  `;
  
  markReadButton.addEventListener('click', () => {
    const newProgress = Math.min(book.progress + 10, 100);
    updateBookProgress(book.id, newProgress);
  });

  // Add reading stats if available
  if (book.startDate) {
    const statsSection = document.createElement('div');
    statsSection.className = 'reading-stats';
    statsSection.innerHTML = `
      <span class="stat">Started: ${new Date(book.startDate).toLocaleDateString()}</span>
      ${book.completionDate ? `<span class="stat">Completed: ${new Date(book.completionDate).toLocaleDateString()}</span>` : ''}
    `;
    card.appendChild(statsSection);
  }
}

// Enhanced Search Book Card Setup
function setupSearchBookCard(card, book) {
  const addButton = card.querySelector('.add-button');
  const isInLibrary = getLibrary().some(b => b.id === book.id);
  
  if (isInLibrary) {
    addButton.disabled = true;
    addButton.innerHTML = `
      <i data-lucide="check-circle"></i>
      In Library
    `;
  } else {
    addButton.addEventListener('click', () => {
      addToLibrary(book);
      addButton.disabled = true;
      addButton.innerHTML = `
        <i data-lucide="check-circle"></i>
        Added to Library
      `;
      showNotification('Book added to library', 'success');
    });
  }

  // Add details button functionality
  const detailsButton = card.querySelector('.details-button');
  detailsButton.addEventListener('click', () => {
    showBookDetails(book);
  });
}

// New Feature: Book Details Modal
function showBookDetails(book) {
  const modal = document.createElement('div');
  modal.className = 'book-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <button class="close-button">
        <i data-lucide="x"></i>
      </button>
      <div class="modal-header">
        <img src="${book.thumbnail}" alt="${book.title}" class="modal-cover">
        <div class="modal-title">
          <h2>${book.title}</h2>
          <p class="modal-authors">${book.authors.join(', ')}</p>
          <div class="modal-badges">
            ${book.categories.map(category => `<span class="category-badge">${category}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="modal-body">
        <p class="description">${book.description}</p>
        <div class="book-metadata">
          ${book.pageCount ? `<div class="metadata-item">
            <i data-lucide="book-open"></i>
            <span>${book.pageCount} pages</span>
          </div>` : ''}
          ${book.publishedDate ? `<div class="metadata-item">
            <i data-lucide="calendar"></i>
            <span>${new Date(book.publishedDate).toLocaleDateString()}</span>
          </div>` : ''}
          ${book.averageRating ? `<div class="metadata-item">
            <i data-lucide="star"></i>
            <span>${book.averageRating.toFixed(1)} / 5</span>
          </div>` : ''}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  initializeLucideIcons();

  modal.querySelector('.close-button').addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Utility Functions
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i data-lucide="${type === 'success' ? 'check-circle' : 'info'}"></i>
    <span>${message}</span>
  `;
  
  document.getElementById('notifications').appendChild(notification);
  initializeLucideIcons();
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function initializeLucideIcons() {
  lucide.createIcons();
}

// Additional functions
function getLibrary() {
  return JSON.parse(localStorage.getItem('library')) || [];
}

function addToLibrary(book) {
  const library = getLibrary();
  const newBook = {
    ...book,
    dateAdded: new Date().toISOString(),
    progress: 0,
    status: 'want-to-read',
    startDate: null,
    completionDate: null
  };
  library.push(newBook);
  localStorage.setItem('library', JSON.stringify(library));
  renderLibrary();
}

function updateBookProgress(bookId, newProgress) {
  const library = getLibrary();
  const bookIndex = library.findIndex(book => book.id === bookId);
  
  if (bookIndex !== -1) {
    const book = library[bookIndex];
    book.progress = newProgress;
    
    if (!book.startDate) {
      book.startDate = new Date().toISOString();
      book.status = 'reading';
    }
    
    if (newProgress >= 100 && book.status !== 'completed') {
      book.status = 'completed';
      book.completionDate = new Date().toISOString();
      showNotification('🎉 Congratulations on finishing the book!', 'success');
    }
    
    localStorage.setItem('library', JSON.stringify(library));
    updateStreak(Math.min(10, book.pageCount || 10));
    renderLibrary();
  }
}
