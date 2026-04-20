import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  Pie,
  Bar
} from "react-chartjs-2";

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

function Dashboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, "predictions"));
      let arr = [];
      snapshot.forEach(doc => arr.push(doc.data()));
      setData(arr);
    };
    fetchData();
  }, []);

  // Count waste types
  const counts = {};
  data.forEach(item => {
    counts[item.class] = (counts[item.class] || 0) + 1;
  });

  const labels = Object.keys(counts);
  const values = Object.values(counts);

  // 🎨 SAME COLORS FOR BOTH CHARTS
  const colors = [
    "#00E676", // green
    "#FF5252", // red
    "#448AFF", // blue
    "#FFD740", // yellow
    "#FF6D00", // orange
    "#7C4DFF", // purple
    "#00BFA5", // teal
    "#FF4081"  // pink
  ];

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "Waste Distribution",
        data: values,
        backgroundColor: colors,
        borderWidth: 1
      }
    ]
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "10px" }}>
        📊 Analytics Dashboard
      </h2>

      <p style={{ textAlign: "center" }}>
        Total Predictions: <b>{data.length}</b>
      </p>

      <div style={{
        display: "flex",
        justifyContent: "space-around",
        flexWrap: "wrap",
        marginTop: "20px"
      }}>

        {/* PIE CHART */}
        <div style={{ width: "300px", margin: "10px" }}>
          <Pie
            data={chartData}
            options={{
              responsive: true,
              animation: {
                animateRotate: true,
                duration: 1500
              }
            }}
          />
        </div>

        {/* BAR CHART (same colors) */}
        <div style={{ width: "400px", margin: "10px" }}>
          <Bar
            data={chartData}
            options={{
              responsive: true,
              animation: {
                duration: 1500
              },
              plugins: {
                legend: {
                  display: false
                }
              }
            }}
          />
        </div>

      </div>
    </div>
  );
}

export default Dashboard;