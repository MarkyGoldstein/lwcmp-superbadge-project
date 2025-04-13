// /Users/markygoldstein/Documents/Salesforce/lightningWebCmpSpecialist/force-app/main/default/lwc/boatSearchResults/boatSearchResults.js
import { LightningElement, api, wire, track } from 'lwc';
import { publish, MessageContext } from 'lightning/messageService';
import getBoats from '@salesforce/apex/BoatDataService.getBoats';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import BOATMC from '@salesforce/messageChannel/BoatMessageChannel__c'; // Import the message channel

// Constant for delay before firing search if needed (optional)
const DELAY = 300;

export default class BoatSearchResults extends LightningElement {
    @api selectedBoatId; // To track which boat tile is selected

    @track boatTypeId = ''; // Store the boat type id from the parent search form
    @track boats;         // Store the wired boat records
    @track isLoading = false; // Control loading state and spinner in parent

    // Private properties
    wiredBoatsResult; // Property to hold the provisioned wire result for refreshApex

    // For Message Service
    @wire(MessageContext)
    messageContext;

    // Public method called by the parent boatSearch component
    @api
    searchBoats(boatTypeId) {
        this.isLoading = true;
        this.notifyLoading(this.isLoading); // Dispatch loading event
        this.boatTypeId = boatTypeId;
        // No need to explicitly call Apex here, @wire takes care of it reactively
        // The change to this.boatTypeId will trigger the @wire function
    }

    // Wire adapter to fetch boat records based on boatTypeId
    @wire(getBoats, { boatTypeId: '$boatTypeId' })
    wiredBoats(result) {
        this.wiredBoatsResult = result; // Store the provisioned result
        if (result.data) {
            this.boats = result.data;
            this.error = undefined;
            this.isLoading = false; // Data loaded
        } else if (result.error) {
            this.error = result.error;
            this.boats = undefined;
            this.showToast('Error', this.error.body.message, 'error');
            this.isLoading = false; // Error occurred
        }
        this.notifyLoading(this.isLoading); // Dispatch done loading event
    }

    // Public method for refreshing the boat list, called by other components potentially
    @api
    async refresh() {
       this.isLoading = true;
       this.notifyLoading(this.isLoading);
       await refreshApex(this.wiredBoatsResult);
       this.isLoading = false;
       this.notifyLoading(this.isLoading);
    }

    // Internal function to dispatch loading/doneloading events to parent
    notifyLoading(isLoading) {
        if (isLoading) {
            this.dispatchEvent(new CustomEvent('loading'));
        } else {
            this.dispatchEvent(new CustomEvent('doneloading'));
        }
    }

    // This function must update selectedBoatId and publish the message
    updateSelectedTile(event) {
        this.selectedBoatId = event.detail.boatId;
        this.sendMessageService(this.selectedBoatId);
    }

    // Publishes the boatId selected unto the message channel
    sendMessageService(boatId) {
        publish(this.messageContext, BOATMC, { recordId: boatId });
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

    // Placeholder for future functionality (like handling different display modes)
    handleSortOptionChange(event) {
        // Implement sorting logic if needed
    }
}
