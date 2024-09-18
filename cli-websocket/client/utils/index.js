import Table from "cli-table3";

export const displayTimers = (timers) => {
  const table = new Table({
    head: ["ID", "Task", "Time"],
    colWidths: [10, 30, 30],
  });

  timers.forEach((timer) => {
    table.push([
      timer.id,
      timer.description,
      timer.is_active
        ? `Active - ${formattedTime(timer.current_duration)}s`
        : `Finished - ${formattedTime(timer.duration)}s`,
    ]);
  });

  console.log(table.toString());
};

const formattedTime = (time) => (time / 1000).toFixed(2);
