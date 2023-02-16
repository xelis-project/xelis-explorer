import { Helmet } from 'react-helmet'

function NotFound() {
  return <div>
    <Helmet>
      <title>Page Not Found</title>
    </Helmet>
    <h1>404 - Not Found</h1>
    <div>The page you are looking for does not exists or was deleted.</div>
  </div>
}

export default NotFound
