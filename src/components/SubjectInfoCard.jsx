import { Book, Users, Beaker, Hash } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'

export function SubjectInfoCard({ subject }) {
  const getComponentInfo = (type) => {
    switch (type) {
      case 'L': return { icon: <Book className="w-3.5 h-3.5" />, label: 'Lec', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' }
      case 'T': return { icon: <Users className="w-3.5 h-3.5" />, label: 'Tut', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' }
      case 'P': return { icon: <Beaker className="w-3.5 h-3.5" />, label: 'Prac', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' }
      default: return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden bg-card border-border/60 hover:border-primary/40 transition-all shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex gap-4">
            
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <h2 className="text-base sm:text-lg font-bold text-foreground leading-tight tracking-tight">
                {subject.name}
              </h2>

              <div className="flex items-center gap-2">
                <span className="flex items-center text-xs font-mono font-bold text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded-md">
                  <Hash className="w-3 h-3 mr-1" />
                  {subject.code}
                </span>
                {subject.isAudit && (
                  <Badge variant="outline" className="text-[10px] h-5 uppercase font-black border-indigo-500/30 text-indigo-500 bg-indigo-500/5 rounded-md">
                    Audit
                  </Badge>
                )}
              </div>

              <div className="mt-2 space-y-2">
                {subject.components.map((component, idx) => {
                  const info = getComponentInfo(component.type);
                  return (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md border ${info.color}`}>
                        {info.icon}
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          {info.label}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-foreground/80 truncate">
                        {component.teacher}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex-shrink-0 flex flex-col items-center justify-center bg-primary/5 border border-primary/20 rounded-lg px-4 py-4 min-w-[60px] h-fit self-start sm:self-center shadow-inner">
              <span className="text-xl font-black text-primary leading-none">
                {subject.credits.toFixed(1)}
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-primary/60 mt-1">
                Credits
              </span>
            </div>

          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default SubjectInfoCard