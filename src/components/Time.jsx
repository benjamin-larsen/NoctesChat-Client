import { ref } from "noctes.jsx";
import Tooltip from "./Tooltip";

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

export function isToday(date, nowDate) {
  return (
    date.getMonth() === nowDate.getMonth() &&
    date.getDate() === nowDate.getDate() &&
    date.getFullYear() === nowDate.getFullYear()
  )
}

function isYesterday(date, nowDate) {
  const yesterdayDate = new Date(nowDate);
  yesterdayDate.setDate(nowDate.getDate() - 1)

  return (
    date.getMonth() === yesterdayDate.getMonth() &&
    date.getDate() === yesterdayDate.getDate() &&
    date.getFullYear() === yesterdayDate.getFullYear()
  )
}

export default {
  methods: {
    updateTime(newTime) {
      const ctx = this;

      if (ctx.currentTimeout) {
        clearTimeout(ctx.currentTimeout);
        ctx.clearTimeout = null;
      }

      const nowDate = new Date();

      const date = new Date(newTime);
      let hours = date.getHours();

      if (hours === 0) hours = 24;

      ctx.dateTime.value = `${hours}:${date.getMinutes().toString().padStart(2, "0")}`;
      ctx.date.value = isToday(date, nowDate) ? "Today at" : isYesterday(date, nowDate) ? "Yesterday at" : `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}/${date.getFullYear()}`;
      ctx.fullDate.value = `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${ctx.dateTime.value}`;
    }
  },

  onCreated(ctx, props) {
    ctx.currentTimeout = null;
    ctx.dateTime = ref("24:00");
    ctx.date = ref("01/01/2025");
    ctx.fullDate = ref("Wednesday, January 1, 2025 12:00 AM");

    ctx.updateTime(props.time);
  },

  beforeUpdate(ctx, props) {
    ctx.updateTime(props.time);
  },

  render(ctx, props) {
    const elProps = {...props};
    delete elProps.time;
  
    return <><Tooltip nSlot="show, hide, tempRef" mode="right">
      <slot name='tooltip'>
        <div style="padding: 6px 8px; background: white; color: black; border-radius: 6px;">${ctx.fullDate.value}</div>
      </slot>
      <span ref={tempRef} onMouseenter={show} onMouseleave={hide} class={"time" + (!props.expanded ? " timeHidden" : "")} {...elProps}>${props.expanded ? `${ctx.date.value} ` : ""}${ctx.dateTime.value}</span>
    </Tooltip></>
  }
}