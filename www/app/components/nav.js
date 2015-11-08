var React = require('react');
var ReactDOM = require('react-dom');
var Router = require('react-router');
var debounce = require('debounce');
var Link = require('react-router').Link;
var mixins = require('baobab-react/mixins');
var Modal = require('react-bootstrap/lib/Modal');
var FAQ = require('./modals/faq');
var Donate = require('./modals/donate');

module.exports = React.createClass({
  displayName: 'Nav',
  mixins: [
    mixins.branch,
    Router.History,
  ],
  cursors: {
    auth: ['auth'],
    loading: ['loading'],
  },

  props: {
    location: React.PropTypes.object.isRequired,
  },

  componentWillMount: function() {
    var search = {
      show: false,
      term: '',
    };

    if (this.props.location && this.props.location.query && this.props.location.query.q) {
      search.show = true;
      search.term = this.props.location.query.q;
    }

    this.setState({search: search});
  },

  componentWillUpdate: function(nextProps) {
    if (nextProps.location && nextProps.location.query && (this.state.search.term != nextProps.location.query.q)) {
      this.setState({search: {
        show: this.state.search.show,
        term: nextProps.location.query.q,
      }});
    }
  },

  getInitialState: function() {
    return {
      login: false,
      faq: false,
      donate: false,
      search: {
        show: false,
        term: '',
      },
    };
  },

  logout: function() {
    //TODO
  },

  toggleSearch: function() {
    if (this.state.search.show) {
      this.setState({search: {
        show: false,
        term: '',
      }});
    }
    else {
      var self = this;
      setTimeout(function() {
        var search = ReactDOM.findDOMNode(self.refs.search);
        var searchxs = ReactDOM.findDOMNode(self.refs.searchxs);
        if (search.offsetParent !== null) { //determine if search box is visible
          search.focus();
        }
        else {
          searchxs.focus();
        }
      }, 300);

      this.setState({search: {
        show: true,
        term: this.state.search.term,
      }});
    }
  },

  search: function(event) {
    if (event.target.value) {
      this.props.location.query.q = event.target.value;
    }
    else {
      delete this.props.location.query.q;
    }

    this.history.pushState(null, '/apps', this.props.location.query);
  },

  open: function(modal) {
    var state = {};
    state[modal] = true;
    this.setState(state);
  },

  close: function(modal) {
    var state = {};
    state[modal] = false;
    this.setState(state);
  },

  renderLoginModal: function() {
    return (
      <Modal show={this.state.login} onHide={this.close.bind(this, 'login')}>
        <Modal.Header closeButton>
          <Modal.Title>Log In</Modal.Title>
        </Modal.Header>

        <Modal.Footer>
          <button className="btn btn-info" onClick={this.close.bind(this, 'login')}>
            <i className="fa fa-close"></i> Close
          </button>

          <form action="/auth/ubuntu" method="post" className="login-modal-footer">
            <button type="submit" className="btn btn-warning">
              <i className="fa fa-linux"></i> Log in via Ubuntu
            </button>
          </form>
        </Modal.Footer>
      </Modal>
    );
  },

  renderLoginButton: function() {
    var button = '';
    if (this.state.auth.loggedin) {
      button = (
        <Link to="/me" className="navbar-toggle clickable">
          <i className="fa fa-user fa-inverse"></i>
        </Link>
      );
    }
    else {
      button = (
        <a className="navbar-toggle clickable" onClick={this.open.bind(this, 'login')}>
          <i className="fa fa-user-plus fa-inverse"></i>
        </a>
      );
    }

    return button;
  },

  renderLoginList: function() {
    var list = '';
    if (this.state.auth.loggedin) {
      list = [
        (
          <li className="hidden-xs">
            <Link to="/me" className="clickable">My Lists</Link>
          </li>
        ), (
          <li>
            <a onClick={this.logout} className="clickable">Log Out</a>
          </li>
        )
      ];
    }
    else {
      list = (
        <li className="hidden-xs">
          <a onClick={this.open.bind(this, 'login')} className="clickable">Log In</a>
        </li>
      );
    }

    return list;
  },

  renderBackButton: function() {
    var link = '/'; //TODO proper logic and see if react router history can handle this
    var cls = 'logo';
    if (this.state.loading) {
      cls = 'logo rotate';
    }

    var icon = '';
    if (false) { //TODO
      icon = <i className="fa fa-chevron-left"></i>;
    }

    var brand = <span className="hidden-xs">uApp Explorer</span>;
    if (!this.state.search.show) {
      brand = (
        <span className="brand-text">
          <span className="visible-xs-inline">uApp Explorer</span>
          <span className="hidden-xs">uApp Explorer</span>
        </span>
      );
    }

    return (
      <span className="navbar-brand">
        <Link to={link} className="link clickable">
          {icon}
          <img src="/img/logo.svg" className={cls} />
          {brand}
        </Link>
      </span>
    );
  },

  renderSearch: function() {
    var search = '';
    if (this.state.search.show) {
      search = (
        <div className="visible-xs">
          <div className="input-group search-box">
            <input type="text" className="form-control" id="search" onChange={debounce(this.search, 300)} defaultValue={this.state.search.term} ref="search" />
          </div>
        </div>
      );
    }

    return search;
  },

  renderSearchXS: function() {
    var search = '';
    if (this.state.search.show) {
      search = (
        <li>
          <div className="input-group hidden-xs search-box">
            <input type="text" className="form-control" id="search" onChange={debounce(this.search, 300)} defaultValue={this.state.search.term} ref="searchxs" />
          </div>
        </li>
      );
    }

    return search;
  },

  renderLanguageList: function() {
    //TODO
    /*
    <li>
      <a className="dropdown-toggle" data-toggle="dropdown" role="button">
        <span translate>Language</span> <span className="caret"></span>
      </a>
      <ul className="dropdown-menu">
        <li ng-className="{active: language == 'en'}">
          <a ng-click="setLanguage('en')" className="clickable">English (US)</a>
        </li>

        <li ng-repeat="lang in languages | maths:'untranslated':'lt':comingTranslation" ng-className="{'active': language == lang.code}">
          <a ng-click="setLanguage(lang.code)" className="clickable">
            <span ng-bind="lang.name"></span>
            <span ng-if="lang.untranslated > partialTranslation">(Partial)</span>
          </a>
        </li>

        <li ng-repeat="lang in languages | maths:'untranslated':'gte':comingTranslation" ng-className="{'active': language == lang.code}">
          <a ng-href="https://translations.launchpad.net/uappexplorer/trunk/+pots/uappexplorer/{{lang.code}}/+translate" className="clickable" target="_blank">
            <span ng-bind="lang.name"></span> (Coming soon!)
          </a>
        </li>

        <li>
          <a href="https://translations.launchpad.net/uappexplorer" target="_blank" translate>Help translate!</a>
        </li>
      </ul>
    </li>
    */

    return '';
  },

  render: function() {
    return (
      <nav className="navbar navbar-material-blue" role="navigation">
        <div className="container">
          <div className="navbar-header">
            <button type="button" className="navbar-toggle" data-toggle="collapse" data-target="#main-menu">
              <i className="fa fa-ellipsis-v fa-inverse"></i>
            </button>

            {this.renderLoginButton()}

            <button type="button" className="navbar-toggle" onClick={this.toggleSearch}>
              <i className="fa fa-search fa-inverse"></i>
            </button>

            {this.renderBackButton()}
            {this.renderSearch()}
          </div>

          <div className="navbar-collapse collapse navbar-right" id="main-menu">
            <ul className="nav navbar-nav">
              {this.renderSearchXS()}

              <li className="hidden-xs">
                <a onClick={this.toggleSearch} className="clickable"><i className="fa fa-search fa-inverse"></i></a>
              </li>
              <li>
                <a onClick={this.open.bind(this, 'faq')} className="clickable">FAQ</a>
              </li>
              <li>
                <a onClick={this.open.bind(this, 'donate')} className="clickable">Donate</a>
              </li>

              {this.renderLoginList()}
              {this.renderLanguageList()}
            </ul>
          </div>
        </div>

        <FAQ show={this.state.faq} onHide={this.close.bind(this, 'faq')} />
        <Donate show={this.state.donate} onHide={this.close.bind(this, 'donate')} />
        {this.renderLoginModal()}
      </nav>
    );
  }
});
