/**
 * Utility functions for input handling
 */

/**
 * Prevents arrow key navigation in number inputs
 * This function should be called when the app initializes
 */
export const disableNumberInputArrowKeys = () => {
  // Function to handle keydown events on number inputs
  const handleNumberInputKeyDown = (event) => {
    // Prevent up and down arrow keys (38 and 40)
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
    }
  };

  // Add the event listener to all number inputs when the DOM is loaded
  const setupEventListeners = () => {
    // Get all number inputs
    const numberInputs = document.querySelectorAll('input[type="number"]');
    
    // Add keydown event listener to each number input
    numberInputs.forEach(input => {
      input.addEventListener('keydown', handleNumberInputKeyDown);
    });
    
    // Setup a mutation observer to handle dynamically added number inputs
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            // Check if the added node is an element
            if (node.nodeType === Node.ELEMENT_NODE) {
              // If it's a number input, add the event listener
              if (node.tagName === 'INPUT' && node.type === 'number') {
                node.addEventListener('keydown', handleNumberInputKeyDown);
              }
              
              // Check for number inputs within the added node
              const childInputs = node.querySelectorAll('input[type="number"]');
              childInputs.forEach(input => {
                input.addEventListener('keydown', handleNumberInputKeyDown);
              });
            }
          });
        }
      });
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, { childList: true, subtree: true });
  };

  // If the DOM is already loaded, set up event listeners immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupEventListeners);
  } else {
    setupEventListeners();
  }
};
