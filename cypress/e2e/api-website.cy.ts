import { uuid } from '../../src/lib/crypto';

describe('Website API tests', () => {
  Cypress.session.clearAllSavedSessions();

  let websiteId;
  let sharedUserId;
  let sharedAuthorization;
  const sharedUsername = `cypress-share-${uuid()}`;

  before(() => {
    cy.login(Cypress.env('umami_user'), Cypress.env('umami_password'));

    cy.request({
      method: 'POST',
      url: '/api/users',
      headers: {
        'Content-Type': 'application/json',
        Authorization: Cypress.env('authorization'),
      },
      body: {
        username: sharedUsername,
        password: 'password',
        role: 'user',
      },
    }).then(response => {
      sharedUserId = response.body.id;
      expect(response.status).to.eq(200);

      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          username: sharedUsername,
          password: 'password',
        },
      }).then(loginResponse => {
        sharedAuthorization = `bearer ${loginResponse.body.token}`;
        expect(loginResponse.status).to.eq(200);
      });
    });
  });

  it('Creates a website for user.', () => {
    cy.fixture('websites').then(data => {
      const websiteCreate = data.websiteCreate;
      cy.request({
        method: 'POST',
        url: '/api/websites',
        headers: {
          'Content-Type': 'application/json',
          Authorization: Cypress.env('authorization'),
        },
        body: websiteCreate,
      }).then(response => {
        websiteId = response.body.id;
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('name', 'Cypress Website');
        expect(response.body).to.have.property('domain', 'cypress.com');
      });
    });
  });

  it('Rejects team website creation.', () => {
    cy.request({
      method: 'POST',
      url: '/api/websites',
      headers: {
        'Content-Type': 'application/json',
        Authorization: Cypress.env('authorization'),
      },
      body: {
        name: 'Team Website',
        domain: 'teamwebsite.com',
        teamId: uuid(),
      },
      failOnStatusCode: false,
    }).then(response => {
      expect(response.status).to.eq(401);
    });
  });

  it('Creates a website with a fixed ID.', () => {
    cy.fixture('websites').then(data => {
      const websiteCreate = data.websiteCreate;
      const fixedId = uuid();
      cy.request({
        method: 'POST',
        url: '/api/websites',
        headers: {
          'Content-Type': 'application/json',
          Authorization: Cypress.env('authorization'),
        },
        body: { ...websiteCreate, id: fixedId },
      }).then(response => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('id', fixedId);
        expect(response.body).to.have.property('name', 'Cypress Website');
        expect(response.body).to.have.property('domain', 'cypress.com');

        // cleanup
        cy.request({
          method: 'DELETE',
          url: `/api/websites/${fixedId}`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: Cypress.env('authorization'),
          },
        });
      });
    });
  });

  it('Returns all tracked websites.', () => {
    cy.request({
      method: 'GET',
      url: '/api/websites',
      headers: {
        'Content-Type': 'application/json',
        Authorization: Cypress.env('authorization'),
      },
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body.data[0]).to.have.property('id');
      expect(response.body.data[0]).to.have.property('name');
      expect(response.body.data[0]).to.have.property('domain');
    });
  });

  it('Gets a website by ID.', () => {
    cy.request({
      method: 'GET',
      url: `/api/websites/${websiteId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: Cypress.env('authorization'),
      },
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('name', 'Cypress Website');
      expect(response.body).to.have.property('domain', 'cypress.com');
    });
  });

  it('Shares a website with a user.', () => {
    cy.request({
      method: 'POST',
      url: `/api/websites/${websiteId}/users`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: Cypress.env('authorization'),
      },
      body: {
        userId: sharedUserId,
      },
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('websiteId', websiteId);
      expect(response.body).to.have.property('userId', sharedUserId);
    });
  });

  it('Allows a shared user to view a website.', () => {
    cy.request({
      method: 'GET',
      url: `/api/websites/${websiteId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: sharedAuthorization,
      },
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('id', websiteId);
    });
  });

  it('Prevents a shared user from updating a website.', () => {
    cy.request({
      method: 'POST',
      url: `/api/websites/${websiteId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: sharedAuthorization,
      },
      body: {
        name: 'Unauthorized Update',
      },
      failOnStatusCode: false,
    }).then(response => {
      expect(response.status).to.eq(401);
    });
  });

  it('Updates a website.', () => {
    cy.fixture('websites').then(data => {
      const websiteUpdate = data.websiteUpdate;
      cy.request({
        method: 'POST',
        url: `/api/websites/${websiteId}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: Cypress.env('authorization'),
        },
        body: websiteUpdate,
      }).then(response => {
        websiteId = response.body.id;
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('name', 'Cypress Website Updated');
        expect(response.body).to.have.property('domain', 'cypressupdated.com');
      });
    });
  });

  it('Updates a website with only shareId.', () => {
    cy.request({
      method: 'POST',
      url: `/api/websites/${websiteId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: Cypress.env('authorization'),
      },
      body: { shareId: 'ABCDEF' },
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('shareId', 'ABCDEF');
    });
  });

  it('Resets a website by removing all data related to the website.', () => {
    cy.request({
      method: 'POST',
      url: `/api/websites/${websiteId}/reset`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: Cypress.env('authorization'),
      },
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('ok', true);
    });
  });

  it('Deletes a website.', () => {
    cy.request({
      method: 'DELETE',
      url: `/api/websites/${websiteId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: Cypress.env('authorization'),
      },
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('ok', true);
    });
  });

  after(() => {
    cy.deleteUser(sharedUserId);
  });
});
