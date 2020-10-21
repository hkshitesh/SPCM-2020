import React, { Component } from 'react'
import PropTypes from 'prop-types'

import Icon from './icon'
import ButtonContent from './button-content'

class GoogleLogout extends Component {
  constructor(props) {
    super(props)
    this.signOut = this.signOut.bind(this)
    this.enableButton = this.enableButton.bind(this)
    this.state = {
      disabled: true,
      hovered: false,
      active: false
    }
  }
  componentDidMount() {
    const {
      jsSrc,
      onFailure,
      isSignedIn,
      clientId,
      cookiePolicy,
      loginHint,
      hostedDomain,
      fetchBasicProfile,
      discoveryDocs,
      uxMode,
      redirectUri,
      scope,
      accessType
    } = this.props
    ;((d, s, id, cb) => {
      const element = d.getElementsByTagName(s)[0]
      const fjs = element
      let js = element
      js = d.createElement(s)
      js.id = id
      js.src = jsSrc
      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs)
      } else {
        d.head.appendChild(js)
      }
      js.onload = cb
    })(document, 'script', 'google-login', () => {
      const params = {
        client_id: clientId,
        cookie_policy: cookiePolicy,
        login_hint: loginHint,
        hosted_domain: hostedDomain,
        fetch_basic_profile: fetchBasicProfile,
        discoveryDocs,
        ux_mode: uxMode,
        redirect_uri: redirectUri,
        scope,
        access_type: accessType
      }
      window.gapi.load('auth2', () => {
        this.enableButton()
        if (!window.gapi.auth2.getAuthInstance()) {
          window.gapi.auth2.init(params).then(
            res => {
              if (isSignedIn && res.isSignedIn.get()) {
                this.handleSigninSuccess(res.currentUser.get())
              }
            },
            err => onFailure(err)
          )
        }
      })
    })
  }
  componentWillUnmount() {
    this.enableButton = () => {}
  }
  enableButton() {
    this.setState({
      disabled: false
    })
  }
  signOut() {
    if (window.gapi) {
      const auth2 = window.gapi.auth2.getAuthInstance()
      if (auth2 != null) {
        auth2.signOut().then(auth2.disconnect().then(this.props.onLogoutSuccess))
      }
    }
  }

  render() {
    const { tag, type, className, disabledStyle, buttonText, children, render, theme, icon } = this.props

    if (render) {
      return render({ onClick: this.signOut })
    }
    const disabled = this.state.disabled || this.props.disabled

    const initialStyle = {
      backgroundColor: theme === 'dark' ? 'rgb(66, 133, 244)' : '#fff',
      display: 'inline-flex',
      alignItems: 'center',
      color: theme === 'dark' ? '#fff' : 'rgba(0, 0, 0, .54)',
      boxShadow: '0 2px 2px 0 rgba(0, 0, 0, .24), 0 0 1px 0 rgba(0, 0, 0, .24)',
      padding: 0,
      borderRadius: 2,
      border: '1px solid transparent',
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'Roboto, sans-serif'
    }

    const hoveredStyle = {
      cursor: 'pointer',
      opacity: 0.9
    }

    const activeStyle = {
      cursor: 'pointer',
      backgroundColor: theme === 'dark' ? '#3367D6' : '#eee',
      color: theme === 'dark' ? '#fff' : 'rgba(0, 0, 0, .54)',
      opacity: 1
    }

    const defaultStyle = (() => {
      if (disabled) {
        return Object.assign({}, initialStyle, disabledStyle)
      }

      if (this.state.active) {
        if (theme === 'dark') {
          return Object.assign({}, initialStyle, activeStyle)
        }

        return Object.assign({}, initialStyle, activeStyle)
      }

      if (this.state.hovered) {
        return Object.assign({}, initialStyle, hoveredStyle)
      }

      return initialStyle
    })()
    const GoogleLogoutButton = React.createElement(
      tag,
      {
        onMouseEnter: () => this.setState({ hovered: true }),
        onMouseLeave: () => this.setState({ hovered: false, active: false }),
        onMouseDown: () => this.setState({ active: true }),
        onMouseUp: () => this.setState({ active: false }),
        onClick: this.signOut,
        style: defaultStyle,
        type,
        disabled,
        className
      },
      [
        icon && <Icon key={1} active={this.state.active} />,
        <ButtonContent icon={icon} key={2}>
          {children || buttonText}
        </ButtonContent>
      ]
    )

    return GoogleLogoutButton
  }
}

GoogleLogout.propTypes = {
  jsSrc: PropTypes.string,
  buttonText: PropTypes.node,
  className: PropTypes.string,
  children: PropTypes.node,
  disabledStyle: PropTypes.object,
  tag: PropTypes.string,
  disabled: PropTypes.bool,
  onLogoutSuccess: PropTypes.func,
  type: PropTypes.string,
  render: PropTypes.func,
  theme: PropTypes.string,
  icon: PropTypes.bool
}

GoogleLogout.defaultProps = {
  type: 'button',
  tag: 'button',
  buttonText: 'Logout of Google',
  disabledStyle: {
    opacity: 0.6
  },
  icon: true,
  theme: 'light',
  jsSrc: 'https://apis.google.com/js/api.js'
}

export default GoogleLogout
