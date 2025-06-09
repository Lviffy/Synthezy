import { useState } from "react";
import { Delete, Download, Folder, MenuIcon, Xmark } from "../assets/icons";
import { useAppContext } from "../provider/AppStates";
import { saveElements, uploadElements } from "../helper/element";

export default function Menu() {
  const { elements, setElements } = useAppContext();
  const [show, setShow] = useState(false);

  const handleMenuToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Menu button clicked");
    setShow((prev) => !prev);
  };

  return (
    <div className="menu">
      <button
        className="menuBtn"
        type="button"
        onClick={handleMenuToggle}
        aria-label={show ? "Close menu" : "Open menu"}
        aria-expanded={show}
        title="Menu"
      >
        {show ? <Xmark /> : <MenuIcon />}
      </button>

      {show && <MenuBox elements={elements} setElements={setElements} setShow={setShow} />}
    </div>
  );
}

function MenuBox({ elements, setElements, setShow }) {
  const uploadJson = () => {
    console.log("Upload clicked");
    uploadElements(setElements);
  };
  
  const downloadJson = () => {
    console.log("Download clicked");
    saveElements(elements);
  };
  
  const reset = () => {
    console.log("Reset clicked");
    setElements([]);
  };

  const handleMenuItemClick = (action, e) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <>
      <div className="menuBlur" onClick={() => setShow(false)}></div>
      <section className="menuItems">
        <button className="menuItem" type="button" onClick={(e) => handleMenuItemClick(uploadJson, e)}>
          <Folder /> <span>Open</span>
        </button>
        <button className="menuItem" type="button" onClick={(e) => handleMenuItemClick(downloadJson, e)}>
          <Download /> <span>Save</span>
        </button>
        <button className="menuItem" type="button" onClick={(e) => handleMenuItemClick(reset, e)}>
          <Delete /> <span>Reset the canvas</span>
        </button>
      </section>
    </>
  );
}