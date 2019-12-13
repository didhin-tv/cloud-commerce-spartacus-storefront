import * as methods from '../../../helpers/cancellations-returns';

describe('Return Request List for Cancellations and Returns', () => {
  before(() => {
    cy.window().then(win => {
      win.localStorage.clear();
    });
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });

  describe('checkout flow', () => {
    it('should go to login and redirect to PDP', () => {
      methods.addToCartAnonymous(methods.products[0]);
    });

    it('should fill in shipping address', () => {
      methods.fillShipping();
    });

    it('should pick delivery mode', () => {
      methods.pickDeliveryMethod();
    });

    it('should fill payment details', () => {
      methods.fillPaymentDetails();
    });

    it('should place order', () => {
      methods.placeOrder();
    });

    it('should check review page', () => {
      methods.reviewOrder();
    });
  });

  // it('should open the return request list tab and see a list', () => {
  //   methods.checkReturnRequestList();
  // });

  // it('should open order detail page when clicking order# on return list', () => {
  //   methods.checkOrderNumberLink();
  // });

  // it('should open return detail page when clicking return# on return list', () => {
  //   methods.checkReturnNumberLink();
  // });
});