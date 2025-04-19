// boatMap.js
import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { subscribe, MessageContext, APPLICATION_SCOPE } from 'lightning/messageService';
import BOATMC from '@salesforce/messageChannel/BoatMessageChannel__c';

// Declare the fields you need
const LONGITUDE_FIELD = 'Boat__c.Geolocation__Longitude__s';
const LATITUDE_FIELD = 'Boat__c.Geolocation__Latitude__s';
const BOAT_FIELDS = [LONGITUDE_FIELD, LATITUDE_FIELD];


export default class BoatMap extends LightningElement {

  // Private properties
  subscription = null;
  @track boatId; // Use @track for reactivity if needed elsewhere, though @wire handles its own reactivity
  @track mapMarkers = [];

  // Public property to receive recordId (optional, but good practice if used elsewhere)
  @api get recordId() {
    return this.boatId;
  }
  set recordId(value) {
    // Setting the attribute ensures it reflects in the DOM if needed
    this.setAttribute('boatId', value);
    this.boatId = value;
  }

  // Property to hold map markers
  @track mapMarkers = [];
  error = undefined; // To store potential wire errors

  // Wire MessageContext for using Message Service functions
  @wire(MessageContext)
  messageContext;

  // Wire the getRecord adapter to fetch boat data based on boatId
  @wire(getRecord, { recordId: '$boatId', fields: BOAT_FIELDS })
  wiredRecord({ error, data }) {
    if (data) {
      this.error = undefined;
      const longitude = getFieldValue(data, LONGITUDE_FIELD);
      const latitude = getFieldValue(data, LATITUDE_FIELD);
      // Ensure coordinates are valid before updating map
      if (longitude && latitude) {
          this.updateMap(longitude, latitude);
      } else {
          // Handle case where geolocation fields might be null
          this.mapMarkers = [];
          console.warn(`Geolocation data missing for boat ${this.boatId}`);
      }
    } else if (error) {
      this.error = error;
      this.boatId = undefined; // Clear boatId on error
      this.mapMarkers = []; // Clear markers on error
      console.error('Error fetching boat record:', JSON.stringify(error));
    }
  }

  // Standard lifecycle hook, called when component is inserted into the DOM
  connectedCallback() {
    this.subscribeMC();
  }

  // Encapsulates logic for subscribing to the message channel
  subscribeMC() {
    // Check if component is already subscribed or if boatId is already set directly
    if (this.subscription || this.boatId) {
      return;
    }
    // Subscribe to the BOATMC message channel
    this.subscription = subscribe(
      this.messageContext,
      BOATMC,
      (message) => {
        // When a message is received, update the boatId
        this.boatId = message.recordId;
      },
      // Listen for messages published from anywhere in the application
      { scope: APPLICATION_SCOPE }
    );
  }

  // Creates the map marker array with the boat's location
  updateMap(longitude, latitude) {
    this.mapMarkers = [
      {
        location: { Latitude: latitude, Longitude: longitude },
        title: 'Selected Boat Location', // Simple title for the marker
        description: `Coords: ${latitude}, ${longitude}` // Optional description
      }
    ];
  }

  // Getter to determine if the map should be shown (optional, but can simplify template)
  get showMap() {
    return this.mapMarkers.length > 0;
  }
}
