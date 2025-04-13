// boatsNearMe.js
import { LightningElement, wire, api, track } from 'lwc';
import getBoatsByLocation from '@salesforce/apex/BoatDataService.getBoatsByLocation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const LABEL_YOU_ARE_HERE = 'You are here!';
const ICON_STANDARD_USER = 'standard:user';
const ERROR_TITLE = 'Error loading Boats Near Me';
const ERROR_VARIANT = 'error';

export default class BoatsNearMe extends LightningElement {
  @api boatTypeId; // Passed in from parent (boatSearchResults)
  @track mapMarkers = [];
  @track isLoading = true;
  @track isRendered = false; // Flag to control rendering behavior
  latitude;
  longitude;
  error = undefined; // To store potential errors

  // Add the wired method from the Apex Class
  // Name it getBoatsByLocation, and use latitude, longitude and boatTypeId
  @wire(getBoatsByLocation, { latitude: '$latitude', longitude: '$longitude', boatTypeId: '$boatTypeId' })
  wiredBoatsJSON({ error, data }) {
    if (data) {
      this.error = undefined;
      this.createMapMarkers(JSON.parse(data)); // Apex method returns JSON string
    } else if (error) {
      this.error = error;
      this.showToast(ERROR_TITLE, error.body.message, ERROR_VARIANT);
      this.isLoading = false; // Stop loading on error
    }
  }

  // Controls the isRendered property
  // Calls getLocationFromBrowser()
  renderedCallback() {
    if (!this.isRendered) {
      this.getLocationFromBrowser();
    }
    this.isRendered = true; // Set flag to true after first render
  }

  // Gets the location from the Browser using navigator.geolocation
  getLocationFromBrowser() {
    this.isLoading = true; // Start loading when asking for location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        // Success Callback
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          // Note: isLoading will be set to false in createMapMarkers or the wire error handler
        },
        // Error Callback
        (error) => {
            this.error = error;
            this.showToast(ERROR_TITLE, `Could not retrieve location: ${error.message}`, ERROR_VARIANT);
            this.isLoading = false; // Stop loading if location fails
        }
      );
    } else {
        // Geolocation not supported
        this.showToast(ERROR_TITLE, 'Geolocation is not supported by this browser.', ERROR_VARIANT);
        this.isLoading = false; // Stop loading if geolocation not supported
    }
  }

  // Creates the map markers
  createMapMarkers(boatData) {
    const newMarkers = boatData.map(boat => {
       return {
            location: {
                Latitude: boat.Geolocation__Latitude__s,
                Longitude: boat.Geolocation__Longitude__s
            },
            title: boat.Name,
            description: `Type: ${boat.BoatType__r ? boat.BoatType__r.Name : 'N/A'}` // Example description
       };
    });
    // Add the user's location marker
    newMarkers.unshift({
        location: {
            Latitude: this.latitude,
            Longitude: this.longitude
        },
        title: LABEL_YOU_ARE_HERE,
        icon: ICON_STANDARD_USER
    });
    this.mapMarkers = newMarkers;
    this.isLoading = false; // Data processed, stop loading
  }

  // Helper method to show toast messages
  showToast(title, message, variant) {
    const evt = new ShowToastEvent({
        title: title,
        message: message,
        variant: variant,
    });
    this.dispatchEvent(evt);
  }
}
