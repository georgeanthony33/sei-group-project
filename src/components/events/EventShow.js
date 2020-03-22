import React from 'react'
import axios from 'axios'
import moment from 'moment'
import { Link } from 'react-router-dom'
import FrontAuth from '../common/FrontAuth'
import { FaMapMarkerAlt } from 'react-icons/fa'

import MapGL, { Marker, NavigationControl } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN



class EventShow extends React.Component {
  state = {
    eventInfo: {
      name: '',
      category: '',
      date: '',
      time: '',
      location: '',
      postcode: '',
      description: '',
      requiredPeople: '',
      longitude: '',
      comments: '',
      user: '',
      attendees: [],
      latitude: ''
    },
    viewport: {
      latitude: 0,
      longitude: 0,
      zoom: 0
    },
    comment: '',
    errors: ''
  }

  componentDidMount() {
    const eventId = this.props.match.params.id
    this.getEvent(eventId)
    // this.getAttendees()
  }

  getEvent = async (id) => {
    try {
      const response = await axios.get(`/api/events/${id}`)
      console.log(response)
      this.setState({ eventInfo: response.data })
      this.setState({
        ...this.state,
        viewport: {
          ...this.state.viewport,
          latitude: Number(response.data.latitude),
          longitude: Number(response.data.longitude),
          zoom: 14
        }
      })
    } catch (err) {
      this.props.history.push('/notfound')
    }
  }

  // getAttendees = () => {
  //   const eventInfo = {...this.state.eventInfo, attendee:}
  // }

  handleChange = ({ target: { value } }) => {
    const comment = value
    this.setState({ comment })
  }

  handleSubmitAttend = async (e) => {
    e.preventDefault()
    const eventId = this.props.match.params.id
    try {
      await axios.get(`/api/events/${eventId}/attend`, {
        headers: { Authorization: `Bearer ${FrontAuth.getToken()}` }
      })
      this.getEvent(eventId)
    } catch (err) {
      this.setState({ errors: err })
    }
  }

  handleSubmitNotAttend = async (e) => {
    e.preventDefault()
    const eventId = this.props.match.params.id
    const attendeeId = this.state.eventInfo.attendees.filter(attendee => attendee._id === FrontAuth.getPayload().sub)[0]._id
    try {
      await axios.delete(`/api/events/${eventId}/attend/${attendeeId}`, {
        headers: { Authorization: `Bearer ${FrontAuth.getToken()}` }
      })
      this.getEvent(eventId)
    } catch (err) {
      this.setState({ errors: err })
    }
  }

  handleSubmitComment = async (e) => {
    e.preventDefault()
    const eventId = this.props.match.params.id
    try {
      await axios.post(`/api/events/${eventId}/comments`, { text: this.state.comment }, {
        headers: { Authorization: `Bearer ${FrontAuth.getToken()}` }
      })
      this.setState({ ...this.state, comment: '' })
      this.getEvent(eventId)
    } catch (err) {
      this.setState({ errors: err })
    }
  }

  isOwner = () => FrontAuth.getPayload().sub === this.state.eventInfo.user._id

  handleDelete = async () => {
    const eventId = this.props.match.params.id
    try {
      await axios.delete(`/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${FrontAuth.getToken()}` }
      })
      this.props.history.push('/')
    } catch (err) {
      this.props.history.push('/notfound')
    }
  }

  mapRef = React.createRef()

  handleViewportChange = (viewport) => {
    this.setState({
      viewport: { ...this.state.viewport, ...viewport }
    })
  }

  render() {
    if (!this.state.eventInfo) return null
    return (
      <>
        <div className="row u-full-width showpage-header">
          <div className="row u-full-width">
            <div className="six columns">
              <div className="row u-full-width">
                <h2><strong>{this.state.eventInfo.name}</strong></h2>
              </div>
              <div className="row u-full-width">
                <div className="six columns">
                  <p>📅 {moment(this.state.eventInfo.date).format('DD/MM/YYYY')}</p>
                </div>
                <div className="six columns">
                  <p>⏰ {this.state.eventInfo.time}</p>
                </div>
              </div>
            </div>
            <Link to={`/profile/${this.state.eventInfo.user._id}`} className="anchor-black-text">
              <div className="one columns">
                <img className="showpage-header-image" src={this.state.eventInfo.user.profileImage} />
              </div>
              <div className="two columns">
                <p>Hosted by <strong>@{this.state.eventInfo.user.handle}</strong></p>
              </div>
            </Link>
            <div className="one column"><p></p></div>
            <div className="two columns">
              {this.isOwner() &&
                <>
                  <Link to={`/events/${this.state.eventInfo._id}/edit`}>
                    <button className="btn-home">Update Event</button>
                  </Link>
                  <button className="btn-home" onClick={this.handleDelete}>Delete Event</button>
                </>
              }
            </div>
          </div>
        </div>
        <div className="container showpage-container">
          <div className="row">
            <div className="four columns showpage-column-left">
              <h3><strong>Event Details</strong></h3>
              <p>⭐️ {this.state.eventInfo.category}</p>
              <p>{this.state.eventInfo.description}</p>
              <p>📍 {this.state.eventInfo.location}, {this.state.eventInfo.postcode.toUpperCase()}</p>
              <div className="showpage-map">
                <MapGL
                  mapboxApiAccessToken={mapboxToken}
                  ref={this.mapRef}
                  height={'270px'}
                  width={'100vw'}
                  mapStyle="mapbox://styles/mapbox/streets-v11"
                  onViewportChange={this.handleViewportChange}
                  {...this.state.viewport}
                >
                  <Marker
                    latitude={this.state.eventInfo.latitude * 1}
                    longitude={this.state.eventInfo.longitude * 1}
                  >
                    <FaMapMarkerAlt
                      className="marker"
                    />
                  </Marker>
                  <div style={{ position: 'absolute', right: 0 }}>
                    <NavigationControl />
                  </div>
                </MapGL>
              </div>
            </div>
            <div className="four columns showpage-column-center">
              <h3><strong>Attendees</strong></h3>
              <div className="row">
                <div className="seven columns">
                  {!(this.state.eventInfo.attendees
                    ?
                    this.state.eventInfo.attendees.filter(attendee => attendee._id === FrontAuth.getPayload().sub)[0] : 'none')
                    &&
                    this.state.eventInfo.requiredPeople - this.state.eventInfo.attendees.length !== 0 &&
                    <form onSubmit={this.handleSubmitAttend}>
                      <button className="btn-show" type="submit">Going</button>
                    </form>
                  }
                  {!!(this.state.eventInfo.attendees
                    ?
                    this.state.eventInfo.attendees.filter(attendee => attendee._id === FrontAuth.getPayload().sub)[0]
                    :
                    'none')
                    &&
                    <form onSubmit={this.handleSubmitNotAttend}>
                      <button className="btn-show" type="submit">Not Going</button>
                    </form>
                  }
                </div>
                <div className="five columns">
                  {this.state.eventInfo.attendees.filter(attendee => attendee._id === FrontAuth.getPayload().sub)[0]
                    ?
                    <p>You&apos;re in!</p>
                    :
                    <div></div>
                  }
                </div>
              </div>
              <div className="row">
                {this.state.eventInfo.requiredPeople - this.state.eventInfo.attendees.length === 0
                  ?
                  <p>This event is full!</p>
                  :
                  this.state.eventInfo.requiredPeople - this.state.eventInfo.attendees.length === 1
                    ?
                    <p>{this.state.eventInfo.requiredPeople - this.state.eventInfo.attendees.length} space left</p>
                    :
                    <p>{this.state.eventInfo.requiredPeople - this.state.eventInfo.attendees.length} spaces left</p>
                }
              </div>
              {this.state.eventInfo.attendees
                ?
                <>
                  {this.state.eventInfo.attendees.map(attendee => (
                    attendee._id === this.state.eventInfo.user._id
                      ?
                      <Link to={`/profile/${attendee}`} key={attendee._id} className="anchor-black-text">
                        <div className="row">
                          <div className="three columns">
                            <img className="showpage-image" src={this.state.eventInfo.user.profileImage} />
                          </div>
                          <div className="nine columns">
                            <p><strong>@{this.state.eventInfo.user.handle}</strong> (host)</p>
                          </div>
                        </div>
                      </Link>
                      :
                      null
                  ))}
                  {this.state.eventInfo.attendees.map(attendee => (
                    attendee._id === this.state.eventInfo.user._id
                      ?
                      null
                      :
                      <Link to={`/profile/${attendee}`} key={attendee._id} className="anchor-black-text">
                        <div className="row">
                          <div className="three columns">
                            <img className="showpage-image" src={attendee.profileImage} />
                          </div>
                          <div className="nine columns">
                            <p><strong>@{attendee.handle}</strong></p>
                          </div>
                        </div>
                      </Link>
                  ))}
                </>
                :
                <div></div>
              }
            </div>
            <div className="four columns showpage-column-right">
              <h3><strong>Comments</strong></h3>
              {this.state.eventInfo.comments
                ?
                this.state.eventInfo.comments.map(comment => (
                  <div key={comment._id} className="row showpage-div">
                    <Link to={`/profile/${comment.user._id}`}>
                      <div className="three columns">
                        <img className="showpage-image" src={comment.user.profileImage} />
                      </div>
                    </Link>
                    <div className="nine columns showpage-comment">
                      <Link to={`/profile/${comment.user._id}`}>
                        <p className="showpage-comment"><strong>@{comment.user.handle}</strong></p>
                      </Link>
                      <p className="showpage-comment">{comment.text}</p>
                    </div>
                  </div>
                ))
                :
                <div></div>
              }
              <hr />
              <form onSubmit={this.handleSubmitComment}>
                <textarea className="showpage-comment" name="comment" onChange={this.handleChange} value={this.state.comment}></textarea>
                <button className="btn-show-comment" type="submit">Send</button>
              </form>
            </div>
          </div>
        </div>
      </>
    )
  }
}

export default EventShow