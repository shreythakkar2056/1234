// Download Brochure Functionality
(function() {
    'use strict';

    // PDF file path - Update this with your actual brochure PDF path
    const BROCHURE_PDF_URL = 'brochures/ConnectoGrowth-Brochure.pdf';
    
    // Tally Form ID
    const TALLY_FORM_ID = '31eOO1';

    // Get all download brochure buttons
    const downloadButtons = [
        document.getElementById('download-brochure-btn'),
        document.getElementById('hero-download-brochure'),
        document.getElementById('book-call-cta'),
        document.getElementById('sticky-download-brochure'),
        document.getElementById('timed-download-brochure')
    ];

    // Function to open Tally form
    function openTallyForm() {
        if (window.Tally) {
            window.Tally.openPopup(TALLY_FORM_ID, {
                layout: 'modal',
                width: 400,
                emoji: {
                    text: '👋',
                    animation: 'wave'
                },
                autoClose: 3000,
                onSubmit: handleFormSubmit
            });
        } else {
            console.error('Tally form not loaded');
            // Fallback: directly trigger download
            triggerDownload();
        }
    }

    // Function to handle form submission
    function handleFormSubmit(payload) {
        console.log('Form submitted:', payload);
        
        // Small delay to ensure form closes
        setTimeout(() => {
            // Trigger PDF download
            triggerDownload();
            
            // Show success modal after a short delay
            setTimeout(() => {
                showDownloadSuccessModal();
            }, 500);
        }, 500);
    }

    // Function to trigger PDF download
    function triggerDownload() {
        // Create a temporary anchor element
        const link = document.createElement('a');
        link.href = BROCHURE_PDF_URL;
        link.download = 'ConnectoGrowth-Brochure.pdf';
        link.target = '_blank';
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('PDF download triggered');
    }

    // Function to show download success modal
    function showDownloadSuccessModal() {
        const modal = document.getElementById('downloadSuccessModal');
        if (modal) {
            modal.classList.add('active');
            
            // Track Facebook Pixel event if available
            if (typeof fbq !== 'undefined') {
                fbq('track', 'Lead', {
                    content_name: 'Brochure Download',
                    content_category: 'Download'
                });
            }
        }
    }

    // Function to close download success modal
    window.closeDownloadModal = function() {
        const modal = document.getElementById('downloadSuccessModal');
        if (modal) {
            modal.classList.remove('active');
        }
    };

    // Add click event listeners to all download buttons
    downloadButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                openTallyForm();
            });
        }
    });

    // Close modal when clicking outside
    const modal = document.getElementById('downloadSuccessModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeDownloadModal();
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeDownloadModal();
        }
    });

    // Listen for Tally form events
    window.addEventListener('message', function(event) {
        // Check if message is from Tally
        if (event.data && event.data.event === 'Tally.FormSubmitted') {
            handleFormSubmit(event.data.payload);
        }
    });

})();
