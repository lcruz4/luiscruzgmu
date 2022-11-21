


const labelClass = 'block text-white text-base mb-2';
const inputClass = 'w-full bg-white text-black border rounded py-2 px-3 leading-tight appearance-none focus:outline-none';

export const Contact = () => (
  <div className="w-full flex justify-center">
    <form className="bg-cyan flex-1 max-w-2xl">
      <div className="mb-2">
        <label className={labelClass} htmlFor="name">
          Name
        </label>
        <input className={inputClass} id="name" type="text" />
      </div>
      <div className="mb-2">
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input className={inputClass} id="email" type="text" />
      </div>
      <div className="mb-6">
        <label className={labelClass} htmlFor="msg">
          Message
        </label>
        <textarea className={`${inputClass} resize-none h-40`} id="msg" />
      </div>
      <button
        className="bg-gray-800 shadow-innerL-tl-cyanL-br-pink-500 hover:shadow-innerL-tl-pink-500-br-cyanL focus:shadow-innerL-tl-pink-500-br-cyanL text-pink-500 transition-shadow ease-in-out duration-500 py-2 px-4 rounded focus:outline-none"
        type="button"
        onClick={() => console.log('blah')}
      >
        Submit
      </button>
    </form>
  </div>
);

export default Contact;