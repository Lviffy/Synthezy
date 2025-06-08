import { useAppContext } from "../provider/AppStates";

export default function ToolBar() {
  const { tools: toolCols, selectedTool, lockTool } = useAppContext();

  // Calculate sequential tool numbers across all groups
  let toolCounter = 0;

  return (
    <section className="toolbar" role="toolbar" aria-label="Drawing tools">
      {toolCols.map((tools, groupIndex) => (
        <div key={groupIndex} className="tool-group" role="group">
          {tools.map((tool, toolIndex) => {
            toolCounter++; // Increment for each tool
            return (
              <button
                key={toolIndex}
                className={
                  "toolbutton" +
                  ` ${tool.slug}` +
                  (selectedTool === tool.slug ? " selected" : "")
                }
                data-lock={lockTool}
                data-tool={tool.slug}
                onClick={() => tool.toolAction(tool.slug)}
                title={tool.title}
                aria-label={tool.title}
                aria-pressed={selectedTool === tool.slug}
                aria-describedby={`tooltip-${tool.slug}`}
              >                <tool.icon />
                {/* Tool number indicator */}
                <span className="tool-number" aria-hidden="true">
                  {toolCounter === 10 ? '0' : toolCounter}
                </span>
                {/* Active indicator for selected tool */}
                {selectedTool === tool.slug && (
                  <div className="tool-indicator" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      ))}
      
      {/* Lock mode indicator */}
      {lockTool && (
        <div className="lock-indicator" aria-label="Lock mode active">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 10V8C6 5.79086 7.79086 4 10 4H14C16.2091 4 18 5.79086 18 8V10H19C19.5523 10 20 10.4477 20 11V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V11C4 10.4477 4.44772 10 5 10H6ZM8 10H16V8C16 6.89543 15.1046 6 14 6H10C8.89543 6 8 6.89543 8 8V10Z"/>
          </svg>
        </div>
      )}
    </section>
  );
}
