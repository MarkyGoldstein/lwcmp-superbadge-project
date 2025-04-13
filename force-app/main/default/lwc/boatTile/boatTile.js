import { LightningElement, api } from 'lwc';

// Constants for CSS classes
const TILE_WRAPPER_SELECTED_CLASS = 'tile-wrapper selected';
const TILE_WRAPPER_UNSELECTED_CLASS = 'tile-wrapper';

export default class BoatTile extends LightningElement {
    // Public properties received from parent
    @api boat;
    @api selectedBoatId;

    
    // Getter for dynamically setting the background image for the picture
    get backgroundStyle() {   // Ensure boat and Picture__c exist before creating the style string
      if (this.boat && this.boat.Picture__c) {
          return `background-image:url(${this.boat.Picture__c})`;
      }
      return ''; // Return empty string if no picture available
  }
    // Getter for dynamically setting the tile class based on whether the
    // current boat is selected
    get tileClass() {
      // Check if this boat tile is the selected one
      if (this.boat && this.selectedBoatId === this.boat.Id) {
          return TILE_WRAPPER_SELECTED_CLASS;
      }
      return TILE_WRAPPER_UNSELECTED_CLASS;
  }
    
    // Fires event with the Id of the boat that has been selected.
    selectBoat() { 
      if (this.boat) {
        // Create and dispatch the custom event 'boatselect'
        const boatselectEvent = new CustomEvent('boatselect', {
            detail: { boatId: this.boat.Id }
        });
        this.dispatchEvent(boatselectEvent);
    }
  }
}