import { useStats } from "@/hooks/use-pomodoro";
import { motion } from "framer-motion";
import { Sprout, TreeDeciduous, Leaf } from "lucide-react";

export default function Tree() {
  const { data: stats } = useStats();
  
  // Simple visual mapping - in a real app, use SVG assets or 3D models
  const stage = stats?.treeStage || "sapling";
  const xp = stats?.experience || 0;

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-sky-50 to-green-50 rounded-3xl border border-border">
      
      {/* Sun/Clouds Decoration */}
      <div className="absolute top-10 right-10 w-24 h-24 bg-yellow-300 rounded-full blur-xl opacity-60" />
      <div className="absolute top-20 left-20 w-32 h-12 bg-white rounded-full blur-lg opacity-80" />

      <div className="text-center z-10 mb-12">
         <h1 className="text-4xl font-display font-bold text-green-900">Your Focus Garden</h1>
         <p className="text-green-700 mt-2 font-medium">Study sessions water your tree. Keep growing!</p>
      </div>

      <div className="relative">
         {/* Tree Visualization */}
         <motion.div 
           initial={{ scale: 0 }}
           animate={{ scale: 1 }}
           transition={{ type: "spring", bounce: 0.5 }}
           className="relative z-10"
         >
           {stage === "sapling" && (
             <div className="flex flex-col items-center">
                <Sprout className="w-32 h-32 text-green-600" />
                <div className="w-16 h-4 bg-black/10 rounded-full blur-sm mt-2" />
             </div>
           )}
           {stage === "juvenile" && (
             <div className="flex flex-col items-center">
                <Leaf className="w-48 h-48 text-green-600" />
                <div className="w-24 h-4 bg-black/10 rounded-full blur-sm mt-2" />
             </div>
           )}
           {stage === "adult" && (
             <div className="flex flex-col items-center">
                <TreeDeciduous className="w-64 h-64 text-green-700" />
                <div className="w-32 h-6 bg-black/10 rounded-full blur-sm mt-2" />
             </div>
           )}
         </motion.div>

         {/* Soil */}
         <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[500px] h-[100px] bg-amber-800/20 rounded-[100%] blur-xl -z-10" />
      </div>

      <div className="mt-12 w-full max-w-md bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
         <div className="flex justify-between text-sm font-bold text-green-900 mb-2">
            <span>Growth Progress</span>
            <span>{xp}%</span>
         </div>
         <div className="h-4 bg-white rounded-full overflow-hidden border border-green-100">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${xp}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
            />
         </div>
         <p className="text-center text-xs text-green-800 mt-2">Next stage at 100%</p>
      </div>
    </div>
  );
}
