import React from 'react'
import Users from './Users'
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import { gql } from 'apollo-boost'
import AuthorizedUser from './AuthorizedUser'
import { withApollo } from 'react-apollo'
import Photos from './Photos'
import PostPhoto from './PostPhoto'

export const ROOT_QUERY = gql`
  query allUsers {
    totalUsers
    totalPhotos
    allUsers {
      ...userInfo
    }
    me {
      ...userInfo
    }
    allPhotos {
      id
      name
      url
    }
  }

  fragment userInfo on User {
    githubLogin
    name
    avatar
  }
`

const LISTEN_FOR_USERS = gql`
  subscription {
    newUser {
      githubLogin
      name
      avatar
    }
  }
`

const LISTEN_FOR_PHOTOS = gql`
  subscription {
    newPhoto {
      id
      name
      url
    }
  }
`

class App extends React.Component {
  componentDidMount() {
    let { client } = this.props

    this.listenForUsers = client.subscribe({ query: LISTEN_FOR_USERS })
      .subscribe(({ data: { newUser } }) => {
        const data = client.readQuery({ query: ROOT_QUERY })
        data.totalUsers += 1
        data.allUsers = [
          ...data.allUsers,
          newUser
        ]
        client.writeQuery({ query: ROOT_QUERY, data })
      })
    
    this.listenForPhotos = client.subscribe({ query: LISTEN_FOR_PHOTOS })
      .subscribe(({ data: { newPhoto } }) => {
        const data = client.readQuery({ query: ROOT_QUERY })
        data.totalPhotos += 1
        data.allPhotos = [
          ...data.allPhotos,
          newPhoto
        ]
        client.writeQuery({ query: ROOT_QUERY, data })
      })
  }

  componentWillUnmount() {
    this.listenForUsers.unsubscribe()
    this.listenForPhotos.unsubscribe()
  }

  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route exact path="/" component={() => (
            <>
              <AuthorizedUser />
              <Users />
              <Photos />
            </>
          )} />
          <Route path="/newPhoto" component={PostPhoto} />
          <Route component={({ location }) => <h1>"{location.pathname}" not found</h1>} />
        </Switch>
      </BrowserRouter>
   )
  }
}

export default withApollo(App)
