import React from 'react'
import { Book, Users, Beaker } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function SubjectInfoCard({ subject }) {
  const getComponentIconWithName = (type) => {
    switch (type) {
      case 'L':
        return (
          <span className="inline-flex items-center gap-1">
            <Book className="w-4 h-4" />
            <span>Lecture</span>
          </span>
        )
      case 'T':
        return (
          <span className="inline-flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>Tutorial</span>
          </span>
        )
      case 'P':
        return (
          <span className="inline-flex items-center gap-1">
            <Beaker className="w-4 h-4" />
            <span>Practical</span>
          </span>
        )
      default:
        return null
    }
  }

  return (
    <Card className="bg-card border border-border transition-all hover:shadow-lg">
      <CardContent className="p-4 md:p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-4">
            <h2 className="text-sm md:text-lg font-semibold text-foreground mb-1">{subject.name}</h2>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm max-[390px]:text-xs text-muted-foreground">{subject.code}</span>
              {subject.isAudit && (
                <Badge>Audit</Badge>
              )}
            </div>
            <div className="space-y-1">
              {subject.components.map((component, idx) => (
                <div key={idx} className="flex items-center text-sm max-[390px]:text-xs text-muted-foreground">
                  {getComponentIconWithName(component.type)}
                  <span className="ml-1"> - {component.teacher}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-lg md:text-xl font-bold text-foreground">
              {subject.credits.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">Credits</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SubjectInfoCard
