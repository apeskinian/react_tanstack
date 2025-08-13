import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';

import Modal from '../UI/Modal.jsx';
import EventForm from './EventForm.jsx';
import { fetchEvent, updateEvent, queryClient } from '../../util/http.js';
import LoadingIndicator from '../UI/LoadingIndicator.jsx';
import ErrorBlock from '../UI/ErrorBlock.jsx';

export default function EditEvent() {
  const params = useParams();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['events', params.id],
    queryFn: ({signal}) => fetchEvent({ signal, id: params.id }) 
  })

  const { mutate } = useMutation({
    mutationFn: updateEvent,
    // optimistic updating
    onMutate: async (data) => {
      // getting the formdata which is passed as data to the onMutate
      const newEvent = data.event
      // stopping any further queries
      await queryClient.cancelQueries({queryKey: ['events', params.id]})
      // getting previous data in case of error so we can rollback
      const previousEvent = queryClient.getQueryData(['events', params.id])
      // setting the query to the new data optimistically
      queryClient.setQueryData(['events', params.id], newEvent);

      return { previousEvent }
    },
    // handling errors and rolling back
    onError: (error, data, context) => {
      queryClient.setQueryData(['events', params.id], context.previousEvent);
    },
    // resyncing backend and frontend
    onSettled: () => {
      queryClient.invalidateQueries(['events', params.id]);
    }
  })

  const navigate = useNavigate();

  function handleSubmit(formData) {
    mutate({ id: params.id, event: formData });
    navigate('../');
  }

  function handleClose() {
    navigate('../');
  }

  let content;

  if (isPending) {
    content = (
      <>
        <div className='center'>
          <LoadingIndicator />
          <p>Preparing to edit...</p>
        </div>
      </>
    )
  }

  if (isError) {
    content = (
      <>
        <ErrorBlock
          title='Error loading event to edit.'
          message={error.info?.message || 'Failed to load event details.'}
        />
        <div className='form-actions'>
          <Link to='../' className='button'>Okay</Link>
        </div>
      </>
    )
  }

if (data) {
  content = (
    <>
      <EventForm inputData={data} onSubmit={handleSubmit}>
        <Link to="../" className="button-text">
          Cancel
        </Link>
        <button type="submit" className="button">
          Update
        </button>
      </EventForm>
    </>
  )
}

  return (
    <Modal onClose={handleClose}>
      {content}
    </Modal>
  );
}
