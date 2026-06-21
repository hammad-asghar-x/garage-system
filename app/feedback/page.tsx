'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Sidebar from '@/components/layout/Sidebar'
import { Star, TrendingUp, MessageSquare, ThumbsUp, Calendar, Car, User } from 'lucide-react'

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all')
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    fiveStar: 0,
    fourStar: 0,
    threeStar: 0,
    twoStar: 0,
    oneStar: 0
  })

  useEffect(() => {
    fetchFeedback()
  }, [])

  const fetchFeedback = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select(`
          *,
          work_orders (wo_number, vehicles (make, model)),
          customers (full_name, phone)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const feedbackData = data || []
      setFeedbacks(feedbackData)
      calculateStats(feedbackData)
    } catch (error: any) {
      console.error('Error fetching feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data: any[]) => {
    const total = data.length
    const sum = data.reduce((acc, f) => acc + (f.rating || 0), 0)
    const average = total > 0 ? (sum / total).toFixed(1) : '0'

    const fiveStar = data.filter(f => f.rating === 5).length
    const fourStar = data.filter(f => f.rating === 4).length
    const threeStar = data.filter(f => f.rating === 3).length
    const twoStar = data.filter(f => f.rating === 2).length
    const oneStar = data.filter(f => f.rating === 1).length

    setStats({ total, average: parseFloat(average), fiveStar, fourStar, threeStar, twoStar, oneStar })
  }

  const filteredFeedbacks = filter === 'all' 
    ? feedbacks 
    : feedbacks.filter(f => f.rating === parseInt(filter))

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600'
    if (rating === 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Star className="h-8 w-8 text-yellow-500" />
            Customer Feedback & Reviews
          </h1>
          <p className="text-slate-600 mt-1">View and manage customer reviews</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Reviews</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Average Rating</p>
                  <p className="text-2xl font-bold text-green-700">{stats.average}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">5 Stars</p>
                  <p className="text-2xl font-bold text-yellow-700">{stats.fiveStar}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-600 fill-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-400">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">4 Stars</p>
              <p className="text-2xl font-bold text-blue-700">{stats.fourStar}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-400">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">3 Stars</p>
              <p className="text-2xl font-bold text-orange-700">{stats.threeStar}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-400">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">1-2 Stars</p>
              <p className="text-2xl font-bold text-red-700">{stats.twoStar + stats.oneStar}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'outline'}
            className={filter === 'all' ? 'bg-blue-600' : ''}
          >
            All Reviews ({feedbacks.length})
          </Button>
          <Button
            onClick={() => setFilter('5')}
            variant={filter === '5' ? 'default' : 'outline'}
            className={filter === '5' ? 'bg-yellow-600' : ''}
          >
            <Star className="h-4 w-4 mr-1 fill-current" /> 5 Stars ({stats.fiveStar})
          </Button>
          <Button
            onClick={() => setFilter('4')}
            variant={filter === '4' ? 'default' : 'outline'}
            className={filter === '4' ? 'bg-blue-500' : ''}
          >
            4 Stars ({stats.fourStar})
          </Button>
          <Button
            onClick={() => setFilter('3')}
            variant={filter === '3' ? 'default' : 'outline'}
          >
            3 Stars ({stats.threeStar})
          </Button>
          <Button
            onClick={() => setFilter('2')}
            variant={filter === '2' ? 'default' : 'outline'}
          >
            2 Stars ({stats.twoStar})
          </Button>
          <Button
            onClick={() => setFilter('1')}
            variant={filter === '1' ? 'default' : 'outline'}
          >
            1 Star ({stats.oneStar})
          </Button>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {filteredFeedbacks.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No feedback found</p>
              </CardContent>
            </Card>
          ) : (
            filteredFeedbacks.map((feedback) => (
              <Card key={feedback.id} className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">
                          {feedback.customers?.full_name || 'Anonymous'}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {feedback.customers?.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= feedback.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`font-bold ${getRatingColor(feedback.rating)}`}>
                        {feedback.rating}/5
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 p-3 rounded-lg mb-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                      <Car className="h-4 w-4" />
                      <span className="font-semibold">{feedback.work_orders?.wo_number}</span>
                      <span>-</span>
                      <span>{feedback.work_orders?.vehicles?.make} {feedback.work_orders?.vehicles?.model}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(feedback.created_at).toLocaleString()}
                    </div>
                  </div>

                  {feedback.comment && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <p className="text-slate-700 italic">"{feedback.comment}"</p>
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      Mark as Helpful
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}