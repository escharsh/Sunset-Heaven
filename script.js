document.addEventListener('DOMContentLoaded', () => {

  const navLinks = document.querySelectorAll('#nav-links li');
  const sections = document.querySelectorAll('main > section');
  const navIndicator = document.getElementById('nav-indicator');

  // Welcome heading animation
  const welcomeHeading = document.querySelector('.banner h1');
  if (welcomeHeading && welcomeHeading.textContent) {
    const text = welcomeHeading.textContent;
    welcomeHeading.innerHTML = '';
    text.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.className = 'char';
        span.style.animationDelay = `${index * 50}ms`;
        welcomeHeading.appendChild(span);
    });
  }

  // --- NAVIGATION LOGIC ---
  function updateNavIndicator(activeLink) {
    if (!activeLink || window.innerWidth <= 768) {
      navIndicator.style.display = 'none';
      return;
    };
    navIndicator.style.display = 'block';
    navIndicator.style.left = `${activeLink.offsetLeft}px`;
    navIndicator.style.width = `${activeLink.offsetWidth}px`;
  }
  
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const targetSectionId = link.getAttribute('data-section');

      if (targetSectionId === 'booking') {
        openBookingModal();
        return;
      }
      
      navLinks.forEach(nav => nav.classList.remove('active'));
      link.classList.add('active');
      updateNavIndicator(link);

      sections.forEach(sec => sec.classList.toggle('active', sec.id === targetSectionId));
    });
  });
  
  updateNavIndicator(document.querySelector('#nav-links li.active'));
  window.addEventListener('resize', () => updateNavIndicator(document.querySelector('#nav-links li.active')));
  
  document.querySelector('.cta-button')?.addEventListener('click', (e) => {
    const targetId = e.target.getAttribute('data-section-target');
    document.querySelector(`li[data-section="${targetId}"]`).click();
  });

  // --- BOOKING MODAL & MULTI-STEP FORM LOGIC ---
  const bookingModal = document.getElementById('booking-modal');
  const bookingForm = document.getElementById('booking-form');
  const bookingFormContainer = document.getElementById('booking-form-container');
  const confirmationContainer = document.getElementById('confirmation-container');

  if (bookingModal) {
    const formSteps = [...bookingForm.querySelectorAll('.form-step')];
    const progressSteps = [...bookingForm.querySelectorAll('.progress-step')];
    const roomSelectionContainer = bookingForm.querySelector('.room-selection-container');
    let currentStep = 0;

    const roomData = [
        { type: 'Standard', price: 120, img: 'https://placehold.co/200x150/1e3a8a/ffffff?text=Standard' },
        { type: 'Deluxe', price: 180, img: 'https://placehold.co/200x150/3b82f6/ffffff?text=Deluxe' },
        { type: 'Suite', price: 300, img: 'https://placehold.co/200x150/172554/ffffff?text=Suite' }
    ];

    if (roomSelectionContainer) {
        roomData.forEach(room => {
            const card = document.createElement('div');
            card.className = 'room-card';
            card.dataset.roomType = room.type;
            card.innerHTML = `<img src="${room.img}" alt="${room.type} Room"><h4>${room.type} Room</h4><p class="price">$${room.price}/night</p>`;
            roomSelectionContainer.appendChild(card);
        });
    }

    function openBookingModal() {
      resetBookingForm();
      bookingModal.classList.add('active');
    }

    function closeBookingModal() {
      bookingModal.classList.remove('active');
    }
    
    function resetBookingForm() {
      bookingForm.reset();
      currentStep = 0;
      showStep(currentStep);
      bookingFormContainer.style.display = 'block';
      confirmationContainer.style.display = 'none';
      roomSelectionContainer.querySelectorAll('.room-card').forEach(card => card.classList.remove('selected'));
      clearErrors();
    }

    bookingModal.addEventListener('click', e => {
        if (e.target.matches('.modal-overlay, .modal-close-btn, .btn-close-modal')) {
          closeBookingModal();
        } else if (e.target.matches('.btn-next')) {
          if (validateStep(currentStep)) showStep(++currentStep);
        } else if (e.target.matches('.btn-prev')) {
          showStep(--currentStep);
        } else if (e.target.closest('.room-card')) {
          const selectedCard = e.target.closest('.room-card');
          bookingForm.querySelector('#room-type').value = selectedCard.dataset.roomType;
          roomSelectionContainer.querySelectorAll('.room-card').forEach(card => card.classList.remove('selected'));
          selectedCard.classList.add('selected');
          clearErrors();
        } else if (e.target.matches('.btn-new-booking')) {
          resetBookingForm();
        }
    });

    bookingForm.addEventListener('submit', e => {
        e.preventDefault();
        if (!validateStep(currentStep)) return;
        
        bookingFormContainer.style.display = 'none';
        confirmationContainer.style.display = 'block';
        
        populateReceipt({
            id: `SH${Date.now()}`.slice(-8),
            name: document.getElementById('fullname').value,
            checkin: document.getElementById('checkin').value,
            checkout: document.getElementById('checkout').value,
            room: document.getElementById('room-type').value,
        });
    });

    function showStep(stepIndex) {
      formSteps.forEach((step, index) => step.classList.toggle('active', index === stepIndex));
      updateProgressBar(stepIndex);
    }

    function updateProgressBar(stepIndex) {
      progressSteps.forEach((step, index) => step.classList.toggle('active', index <= stepIndex));
      const progressWidth = stepIndex > 0 ? (stepIndex / (progressSteps.length - 1)) * 100 : 0;
      bookingForm.querySelector('.progress-bar').style.setProperty('--progress-width', `${progressWidth}%`);
    }

    function validateStep(stepIndex) {
        clearErrors();
        let isValid = true;
        const stepInputs = formSteps[stepIndex].querySelectorAll('[required]');
        
        stepInputs.forEach(input => {
            const errorId = `${input.id}-error`;
            if (!input.value.trim()) {
              isValid = false; showError(errorId, 'This field is required.');
            } else {
              if (input.id === 'checkout' && document.getElementById('checkin').value >= input.value) { isValid = false; showError(errorId, 'Must be after check-in date.'); }
              if (input.id === 'checkin' && input.value < new Date().toISOString().split('T')[0]) { isValid = false; showError(errorId, 'Date cannot be in the past.'); }
              if (input.id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) { isValid = false; showError(errorId, 'Invalid email address.'); }
              if (input.id === 'phone' && !/^\d{10,}$/.test(input.value.replace(/\D/g, ''))) { isValid = false; showError(errorId, 'Invalid phone number.'); }
              if (input.id === 'age' && input.value < 18) { isValid = false; showError(errorId, 'Must be 18 or older.'); }
            }
        });
        return isValid;
    }

    function clearErrors() { bookingForm.querySelectorAll('.error-message').forEach(el => el.textContent = ''); }
    function showError(id, message) { const el = document.getElementById(id); if (el) el.textContent = message; }

    function populateReceipt(details) {
        const roomPrices = { 'Standard': 120, 'Deluxe': 180, 'Suite': 300 };
        const diffDays = Math.max(1, Math.ceil(Math.abs(new Date(details.checkout) - new Date(details.checkin)) / (1000 * 60 * 60 * 24)));
        const totalPrice = diffDays * (roomPrices[details.room] || 120);
        document.getElementById('receipt-id').textContent = details.id;
        document.getElementById('receipt-name').textContent = details.name;
        document.getElementById('receipt-total').textContent = `$${totalPrice.toLocaleString()}`;
    }
  }

  // --- SCROLL & LIGHTBOX LOGIC ---
  const scrollElements = document.querySelectorAll('.anim-on-scroll, .anim-slide-in-left, .anim-slide-in-right');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    });
  }, { threshold: 0.1 });
  scrollElements.forEach(el => observer.observe(el));

  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    document.body.addEventListener('click', e => {
      if (e.target.closest('.card-image')) {
          lightbox.style.display = 'flex';
          lightbox.querySelector('img').src = e.target.closest('.card-image').querySelector('img').src;
      } else if (e.target.matches('.lightbox, .lightbox-close')) {
          lightbox.style.display = 'none';
      }
    });
  }

  // --- AI CHAT WIDGET ---
  const assistantBtn = document.getElementById('assistant-btn');
  const chatWindow = document.getElementById('chat-window');
  const closeChatBtn = document.getElementById('chat-close-btn');
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const suggestionsContainer = document.getElementById('chat-suggestions');

  if (chatWindow) {
    assistantBtn.addEventListener('click', () => chatWindow.classList.toggle('open'));
    closeChatBtn.addEventListener('click', () => chatWindow.classList.remove('open'));

    const addMessage = (text, sender) => {
        const typingIndicator = chatMessages.querySelector('.typing');
        if (typingIndicator) typingIndicator.remove();

        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender);
        messageElement.textContent = text;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };
    
    const showTypingIndicator = () => {
      const indicatorElement = document.createElement('div');
      indicatorElement.classList.add('chat-message', 'typing');
      indicatorElement.textContent = 'Assistant is typing...';
      chatMessages.appendChild(indicatorElement);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const handleUserInput = () => {
        const userText = chatInput.value.trim();
        if (!userText) return;

        addMessage(userText, 'user');
        chatInput.value = '';
        suggestionsContainer.style.display = 'none';

        showTypingIndicator();
        
        setTimeout(() => {
            const aiResponse = getAIResponse(userText);
            addMessage(aiResponse, 'assistant');
        }, 1500);
    };
    
    chatSendBtn.addEventListener('click', handleUserInput);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleUserInput(); });

    suggestionsContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('suggestion-chip')) {
          chatInput.value = e.target.textContent;
          handleUserInput();
      }
    });

    const getAIResponse = (query) => {
        const q = query.toLowerCase();
        if (q.includes('room') || q.includes('price') || q.includes('cost')) {
            return "Our rooms start at $120/night for a Standard Room, $180 for a Deluxe Room, and $300 for a Luxury Suite. You can find more details in the 'Rooms' section.";
        }
        if (q.includes('spa') || q.includes('massage')) {
            return "Yes, we have a full-service Spa & Wellness center offering various treatments. You can see our main offerings under the 'Facilities' section.";
        }
        if (q.includes('check-in') || q.includes('checkin')) {
            return "Standard check-in time is at 3:00 PM and check-out is at 11:00 AM. For early check-in requests, please contact our front desk.";
        }
        if (q.includes('pool') || q.includes('swimming')) {
            return "Our stunning swimming pool is open from 7:00 AM to 10:00 PM daily for all our guests to enjoy.";
        }
        if (q.includes('book') || q.includes('booking')) {
            return "You can book a room directly through our website by clicking the 'Booking' link in the navigation menu!";
        }
        if (q.includes('hello') || q.includes('hi')) {
            return "Hello! How can I assist you with your stay at Sunset Haven?";
        }

        return "I'm sorry, I can only answer basic questions about our rooms, facilities, and booking. For more detailed inquiries, please visit the 'Contact' section.";
    };
  }

  // --- CONTACT FORM SUBMISSION ---
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // In a real application, you would send this data to a server.
      // For this demo, we'll just show a success message.
      alert('Thank you for your message! We will get back to you shortly.');
      contactForm.reset();
    });
  }

});