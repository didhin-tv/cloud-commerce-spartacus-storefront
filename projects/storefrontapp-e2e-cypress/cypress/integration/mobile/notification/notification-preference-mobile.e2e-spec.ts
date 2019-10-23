import {registerAndLogin} from '../../../helpers/update-email';
import * as notification from '../../../helpers/notification';

import { formats } from '../../../sample-data/viewports';

context(`${formats.mobile.width + 1}My Account - Notification Preference`, () => {
  before(() => {
    cy.window().then(win => win.sessionStorage.clear());
    cy.viewport(formats.mobile.width, formats.mobile.height);
  });

  describe('notification preference test for anonymous user', () => {
    it('should redirect to login page for anonymous user', () => {
      notification.accessPageAsAnonymous();

      cy.location('pathname').should('contain', '/login');
    });
  });

  describe('notification preference test for logged in user', () => {
    beforeEach(() => {
      registerAndLogin();
      cy.visit('/');

    });

    it('should enable/disable notification preference', () => {
      notification.navigateToNotificationPreferencePage()
      notification.channelEnable();
      notification.verifyChannelEnabled();
  
      notification.channelDisable();
      notification.verifyChannelDisabled();
    });
  
    it('should show correct email channel after update email address', () => {
      notification.navigateToNotificationPreferencePage();
      notification.verifyEmailChannel();
      notification.updateEmail();
      notification.navigateToNotificationPreferencePage();
  
      notification.verifyUpdatedEmailChannel();
    });
  });
});
