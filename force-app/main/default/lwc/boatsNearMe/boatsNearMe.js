import { LightningElement, wire, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getBoatsByLocation from '@salesforce/apex/BoatDataService.getBoatsByLocation';

// Constants for messages and icons
const LABEL_YOU_ARE_HERE = 'You are here!';
const ICON_STANDARD_USER = 'standard:user';
const ERROR_TITLE = 'Error loading Boats Near Me';
const ERROR_VARIANT = 'error';

export default class BoatsNearMe extends LightningElement {
  @api boatTypeId;
  @track mapMarkers = [];
  @track isLoading = true;
  @track isRendered = false;
  @track latitude;
  @track longitude;
  @track error = undefined;

  @wire(getBoatsByLocation, { latitude: '$latitude', longitude: '$longitude', boatTypeId: '$boatTypeId' })
  wiredBoatsJSON({ error, data }) {
    if (data) {
      this.error = undefined;
      try {
        // Ensure data is parsed correctly before passing
        const boatData = JSON.parse(data);
        this.createMapMarkers(boatData);
      } catch (parseError) {
        // Handle potential JSON parsing errors
        this.error = parseError;
        this.mapMarkers = [];
        this.dispatchEvent(
          new ShowToastEvent({
            title: ERROR_TITLE,
            message: 'Error parsing boat data.',
            variant: ERROR_VARIANT
          })
        );
        this.isLoading = false;
      }
    } else if (error) {
      this.error = error;
      this.mapMarkers = [];
      this.dispatchEvent(
        new ShowToastEvent({
          title: ERROR_TITLE,
          message: error.body ? error.body.message : 'An unknown error occurred.',
          variant: ERROR_VARIANT
        })
      );
      this.isLoading = false;
    }
  }

  renderedCallback() {
    if (!this.isRendered) {
      this.getLocationFromBrowser();
    }
    this.isRendered = true;
  }

  getLocationFromBrowser() {
    this.isLoading = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          this.error = undefined;
          // Wire service automatically triggers data fetch
        },
        (err) => {
          this.error = err;
          this.dispatchEvent(
            new ShowToastEvent({
              title: ERROR_TITLE,
              message: `Could not get location: ${err.message}`,
              variant: ERROR_VARIANT
            })
          );
          this.isLoading = false;
          this.mapMarkers = [];
        },
        // Optional: Add options for geolocation if needed, e.g., timeout
        // { timeout: 10000 }
      );
    } else {
      this.error = new Error('Geolocation is not supported by this browser.');
      this.dispatchEvent(
        new ShowToastEvent({
          title: ERROR_TITLE,
          message: 'Geolocation is not supported by this browser.',
          variant: ERROR_VARIANT
        })
      );
      this.isLoading = false;
      this.mapMarkers = [];
    }
  }

  // Creates the map markers array based on the boat data received
  createMapMarkers(boatData) {
    // Handle null/empty boat data
    if (!boatData || boatData.length === 0) {
        // If we have a user location, show only that marker. Otherwise, empty.
        if (this.latitude && this.longitude) {
            this.mapMarkers = [{
                location: {
                    Latitude: this.latitude,
                    Longitude: this.longitude
                },
                title: LABEL_YOU_ARE_HERE,
                icon: ICON_STANDARD_USER
            }];
        } else {
            this.mapMarkers = []; // Clear markers if no boats and no user location yet
        }
        this.isLoading = false; // Stop loading spinner
        return; // Exit
    }

    // Map boat data to markers, including only required fields
    const newMarkers = boatData.map(boat => {
        // Basic validation for boat location data
        if (boat.Geolocation__Latitude__s && boat.Geolocation__Longitude__s) {
            return {
                location: {
                    Latitude: boat.Geolocation__Latitude__s,
                    Longitude: boat.Geolocation__Longitude__s
                },
                title: boat.Name // Only include title as explicitly required
            };
        }
        return null; // Return null for boats without location
    }).filter(marker => marker !== null); // Filter out any null markers

    // Add the user's location marker at the beginning if coordinates are available
    if (this.latitude && this.longitude) {
        newMarkers.unshift({
            location: {
                Latitude: this.latitude,
                Longitude: this.longitude
            },
            title: LABEL_YOU_ARE_HERE,
            icon: ICON_STANDARD_USER
        });
    }

    this.mapMarkers = newMarkers; // Assign the final array
    this.isLoading = false; // Data processed, stop loading spinner
  }
}
