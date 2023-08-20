import { useState } from 'react';
import useNavIntersection from '../../hooks/useNavIntersection';
import { NavItems } from '../../types';

const labelClass = 'block text-white text-base mb-2';
const inputClass =
  'w-full bg-white text-black border rounded py-2 px-3 leading-tight appearance-none focus:outline-none';

export const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const ref = useNavIntersection(0.2, NavItems.Contact);

  return (
    <div ref={ref} className='w-full flex flex-col justify-center'>
      <div className={`overflow-hidden transition-all delay-500 duration-500 ${formSubmitted ? 'max-h-28' : 'max-h-0'}`}>
        <div className='mb-2'>
          <p className='text-white text-2xl mb-2'>Thank you!</p>
          <p className='text-white text-base mb-2'>
            Your message has been sent. I will get back to you as soon as
            possible.
          </p>
        </div>
      </div>
      <form className={`bg-cyan flex-1 max-w-2xl overflow-hidden transition-all duration-500 ${formSubmitted ? 'max-h-0' : 'max-h-800'}`}>
        <div className='mb-2'>
          <label className={labelClass} htmlFor='name'>
            Name
          </label>
          <input
            className={inputClass}
            id='name'
            type='text'
            value={name}
            onChange={({ target: { value } }) => setName(value)}
          />
        </div>
        <div className='mb-2'>
          <label className={labelClass} htmlFor='email'>
            Email
          </label>
          <input
            className={inputClass}
            id='email'
            type='text'
            value={email}
            onChange={({ target: { value } }) => setEmail(value)}
          />
        </div>
        <div className='mb-6'>
          <label className={labelClass} htmlFor='msg'>
            Message
          </label>
          <textarea
            className={`${inputClass} resize-none h-40`}
            id='msg'
            value={message}
            onChange={({ target: { value } }) => setMessage(value)}
          />
        </div>
        <button
          className='bg-gray-800 shadow-innerL-tl-cyanL-br-pink-500 hover:shadow-innerL-tl-pink-500-br-cyanL focus:shadow-innerL-tl-pink-500-br-cyanL text-pink-500 transition-shadow ease-in-out duration-500 py-2 px-4 rounded focus:outline-none'
          type='button'
          onClick={() =>
            fetch('/api/mailjet', {
              method: 'POST',
              body: JSON.stringify({ name, email, message }),
            })
              .then(async (res) => {
                const respObj = await res.json();

                if (respObj.success) {
                  setFormSubmitted(true);
                }
              })
              .catch((error) => console.error(error))
          }
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default Contact;
