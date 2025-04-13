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
  // Private
  subscription = null;
  @track boatId; // Use @track to make it reactive for the template if needed, though getRecord handles reactivity

  // Public properties exposed in Lightning App Builder
  @api get recordId() {
    return this.boatId;
  }
  set recordId(value) {
    this.setAttribute('boatId', value); // Standard practice for reflecting API property to attribute
    this.boatId = value;
  }

  // Controls the map marker visibility
  error = undefined;
  @track mapMarkers = [];

  // Provides boat data via wire service
  @wire(getRecord, { recordId: '$boatId', fields: BOAT_FIELDS })
  wiredRecord({ error, data }) {
    // Error handling
    if (data) {
      this.error = undefined;
      const longitude = getFieldValue(data, LONGITUDE_FIELD);
      const latitude = getFieldValue(data, LATITUDE_FIELD);
      this.updateMap(longitude, latitude);
    } else if (error) {
      this.error = error;
      this.boatId = undefined;
      this.mapMarkers = [];
    }
  }

  // Wire MessageContext for Message Service
  @wire(MessageContext)
  messageContext;

  // Subscribes to the message channel
  subscribeMC() {
    // local boatId must receive the recordId from the message
    if (this.subscription || this.recordId) { // Check if already subscribed or if recordId is set directly
        return;
    }
    // Subscribe to the message channel to listen for boat selection events
    this.subscription = subscribe(
        this.messageContext,
        BOATMC,
        (message) => { this.boatId = message.recordId }, // Update boatId when a message is received
        { scope: APPLICATION_SCOPE } // Listen for messages published from anywhere in the application
    );
  }

  // Runs when component is connected, subscribes to BoatMC
  connectedCallback() {
    this.subscribeMC();
  }

  // Creates the map markers array with the single boat location.
  updateMap(longitude, latitude) {
    this.mapMarkers = [{
        location: { Latitude: latitude, Longitude: longitude },
        title: 'Selected Boat Location', // Or potentially fetch the boat name if needed
        description: `Coords: ${latitude}, ${longitude}`
    }];
  }

  // Getter method for displaying the map component, or a helper method.
  get showMap() {
    return this.mapMarkers.length > 0;
  }
}