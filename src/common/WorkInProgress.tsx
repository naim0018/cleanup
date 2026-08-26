const WorkInProgress = ({ title }: { title: string }) => {
  return (
    <div className="w-full h-[90vh] flex items-center justify-center px-6">
      <h1
        className="font-black uppercase text-center leading-tight tracking-widest text-slate-200! dark:text-slate-700 select-none"
        style={{ fontSize: "clamp(1rem, 8vw, 4rem)" }}
      >
        {title}
      </h1>
    </div>
  );
};

export default WorkInProgress;
