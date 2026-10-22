// As variantes dark mantem o contraste dos fundos, textos e controles.
const Input = (props) => {
  return (
    <input
      {...props}

      className="min-h-11 w-full rounded-md bg-white dark:bg-zinc-800 px-3 py-2 text-base text-[#23221d] dark:text-zinc-100 placeholder-amber-600 dark:placeholder-zinc-400 outline-none"
    />
  );
};

export default Input;
