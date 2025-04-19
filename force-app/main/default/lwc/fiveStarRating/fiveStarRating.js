import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import fivestar from '@salesforce/resourceUrl/fivestar'; // Import the static resource

// Constants
const ERROR_TITLE = 'Error loading five-star';
const ERROR_VARIANT = 'error';
const EDITABLE_CLASS = 'c-rating'; // Class for editable mode
const READ_ONLY_CLASS = 'readonly c-rating'; // Class for read-only mode

export default class FiveStarRating extends LightningElement {
  // Public properties
  @api readOnly = false;
  @api value; // Current rating value

  // Private properties
  editedValue; // Stores the rating before confirmation/dispatch
  isRendered = false; // Flag to ensure scripts load only once

  // Getter for the CSS class based on readOnly status
  get starClass() {
    return this.readOnly ? READ_ONLY_CLASS : EDITABLE_CLASS;
  }

  // Rendered callback to load scripts and initialize rating system
  renderedCallback() {
    // Perform initialization only after the component is rendered and scripts haven't been loaded yet
    if (this.isRendered) {
      return;
    }
    this.loadScripts();
    this.isRendered = true;
  }

  // Loads the necessary scripts and CSS from the static resource
  loadScripts() {
    Promise.all([
      loadScript(this, fivestar + '/rating.js'),
      loadStyle(this, fivestar + '/rating.css')
    ]).then(() => {
      this.initializeRating(); // Initialize after scripts are loaded
    }).catch(error => {
      // Show error toast if scripts fail to load
      this.dispatchEvent(
        new ShowToastEvent({
          title: ERROR_TITLE,
          message: error.message || error.body.message, // Handle different error structures
          variant: ERROR_VARIANT,
        })
      );
      console.error('Error loading five-star scripts/styles:', error);
    });
  }

  // Initializes the third-party rating script
  initializeRating() {
    let domEl = this.template.querySelector('ul'); // Get the UL element
    if (!domEl) {
        console.error('FiveStarRating: UL element not found for initialization.');
        return;
    }
    // The rating script expects the element, max rating, initial value, and a callback
    let currentRating = this.value || 0; // Use current value or default to 0
    let readOnlyMode = this.readOnly;

    // Assuming the third-party script has a global function like 'rating'
    // Adjust this call based on the actual function provided by rating.js
    if (window.rating) {
        window.rating(domEl, currentRating, (rating) => {
            // This callback function is executed when a rating is selected *in edit mode*
            if (!readOnlyMode) { // Only dispatch event if not read-only
                this.ratingChanged(rating);
            }
        });
        // If the library needs explicit read-only handling after init, add it here
        // e.g., if (readOnlyMode) { domEl.someReadOnlyMethod(); }

    } else {
        console.error('FiveStarRating: rating function not found on window object.');
        // Show a toast or log an error if the library function isn't available
        this.dispatchEvent(
            new ShowToastEvent({
                title: ERROR_TITLE,
                message: 'The rating library script did not load correctly.',
                variant: ERROR_VARIANT,
            })
        );
    }
  }

  // Handles the rating change event from the third-party script
  ratingChanged(rating) {
    // Prevent dispatching if read-only (double check)
    if (this.readOnly) {
        return;
    }
    // Update internal value (optional, depends if you need it before dispatch)
    this.editedValue = rating;

    // Dispatch the custom event 'ratingchange'
    const ratingChangeEvent = new CustomEvent('ratingchange', {
      detail: { rating: rating } // Pass the selected rating in the detail
    });
    this.dispatchEvent(ratingChangeEvent);
  }
}
