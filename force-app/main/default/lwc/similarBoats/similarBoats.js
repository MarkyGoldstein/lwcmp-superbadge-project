import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
// Import the Apex method
import getSimilarBoats from '@salesforce/apex/BoatDataService.getSimilarBoats';

export default class SimilarBoats extends NavigationMixin(LightningElement) {
    // Private properties
    relatedBoats;
    boatId;
    error;

    // Public property to receive recordId from the page context
    @api
    get recordId() {
        return this.boatId;
    }
    set recordId(value) {
        // Ensure the value is assigned and reflected
        this.setAttribute('boatId', value);
        this.boatId = value;
    }

    // Public property received from the component configuration
    @api similarBy;

    // Wire the Apex method
    // It automatically re-runs when boatId or similarBy changes
    @wire(getSimilarBoats, { boatId: '$boatId', similarBy: '$similarBy' })
    similarBoats({ error, data }) {
        if (data) {
            this.relatedBoats = data;
            this.error = undefined; // Clear previous error if data is received
        } else if (error) {
            this.error = error;
            this.relatedBoats = undefined; // Clear data on error
            console.error(`Error fetching similar boats by ${this.similarBy}:`, JSON.stringify(error));
        }
    }

    // Getter for the card title
    get getTitle() {
        // Use backticks for template literal for cleaner concatenation
        return `Similar boats by ${this.similarBy}`;
    }

    // Getter to determine if no boats are found
    get noBoats() {
        // Check if relatedBoats is truthy and has length > 0
        return !(this.relatedBoats && this.relatedBoats.length > 0);
    }

    // Handles the 'boatselect' event from the c-boat-tile component
    openBoatDetailPage(event) {
        // Get the boatId from the event detail payload
        const selectedBoatId = event.detail.boatId;
    
        if (!selectedBoatId) {
            console.error('Cannot navigate, selected boatId is missing from event detail.');
            return;
        }
    
        // Use NavigationMixin to navigate to the standard record page in view mode
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: selectedBoatId,   // Use the Id from the event
                objectApiName: 'Boat__c', // Specify the object API name
                actionName: 'view'          // Specify view mode
            }
        });
      }
    
}
