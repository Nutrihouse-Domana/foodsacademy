import React from "react";
import { useNavigate } from "react-router-dom";
import { isActiveCourse } from "../utils/app";

const CarouselCard = ({
  id,
  title,
  icon,
  icon_url,
  caminho_icon,
  className = "",
  ativo,
  onClick,
}) => {
  const navigate = useNavigate();

  const imageSrc =
    icon_url || caminho_icon || icon || "/img/default-course-icon.png";

  const handleClick = () => (onClick ? onClick() : navigate(`/video/${id}`));
  const isActive = isActiveCourse(ativo);
  const hasCustomBackground = /\bbg-/.test(className);
  const gradientClass = !isActive
    ? "bg-[linear-gradient(135deg,_rgba(25,_25,_25,_0.75),_rgba(45,_45,_45,_0.5))] ring-1 ring-black/20"
    : hasCustomBackground
      ? ""
      : "bg-[linear-gradient(135deg,_#B95758,_#e14d3a)]";

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex min-h-[10rem] w-full items-center justify-start rounded-lg p-5 text-left font-poppins text-white shadow-xl transition duration-200 hover:-translate-y-1 hover:shadow-2xl sm:min-h-[11rem] sm:p-6 ${gradientClass} ${className}`}
      >
        <img
          src={imageSrc}
          alt={title}
          className="mr-4 h-14 w-14 shrink-0 object-contain drop-shadow-lg sm:h-20 sm:w-20"
        />

        <h2 className="min-w-0 flex-1 break-words text-sm font-semibold leading-snug sm:text-lg">
          {title}
        </h2>
      </button>
    </>
  );
};

export default CarouselCard;
