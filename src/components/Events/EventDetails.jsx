import { Link, Outlet, useNavigate, useParams } from 'react-router-dom';
import { deleteEvent, fetchEvent, queryClient } from '../../util/http.js';

import Header from '../Header.jsx';
import { useQuery, useMutation } from '@tanstack/react-query';
import LoadingIndicator from '../UI/LoadingIndicator.jsx';
import ErrorBlock from '../UI/ErrorBlock.jsx';

export default function EventDetails() {
  // getting the id from the router parameters
  const params = useParams();

  const navigate = useNavigate();

  const { data, isPending, isError, error } = useQuery({
    queryKey: [ 'events', params.id ],
    queryFn: ({signal}) => fetchEvent({ signal, id: params.id })
  })

  const { mutate } = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['events'],
        refetchType: 'none' // stops the query being fetched for a deleted event while still on the page
      });
      navigate('/events');
    }
  });

  function handleDelete() {
    mutate({ id: params.id })
  }

  let content;

  if (isPending) {
    content = (
      <div id='event-details-content' className='center'>
        <LoadingIndicator />
        <p>Fetching even data...</p>
      </div>
    )
  }

  if (isError) {
    content = (
      <div id='event-details-content' className='center'>
        <ErrorBlock
          title='An error occurred'
          message={error.info?.message || 'Failed to load event details.'}
        />
      </div>
    )
  }

  if (data) {
    const formattedDate = new Date(data.date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    content = (
      <>
        <header>
          <h1>{data.title}</h1>
          <nav>
            <button onClick={handleDelete}>Delete</button>
            <Link to="edit">Edit</Link>
          </nav>
        </header>
        <div id="event-details-content">
          <img src={`http://localhost:3000/${data.image}`} alt={data.title} />
          <div id="event-details-info">
            <div>
              <p id="event-details-location">{data.location}</p>
              <time dateTime={`Todo-DateT$Todo-Time`}>{formattedDate} @ {data.time}</time>
            </div>
            <p id="event-details-description">{data.description}</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Outlet />
      <Header>
        <Link to="/events" className="nav-item">
          View all Events
        </Link>
      </Header>
      <article id="event-details">
        {content}
      </article>
    </>
  );
}
