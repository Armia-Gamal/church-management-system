import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import leaderService from '../../services/leaderService'
import memberService from '../../services/memberService'
import roverService from '../../services/roverService'
import './Dashboard.css'

const formatNumber = (value) => new Intl.NumberFormat('ar-EG').format(value)

function Dashboard() {
  const [stats, setStats] = useState({
    leaders: 0,
    members: 0,
    rovers: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadStats = async () => {
      setIsLoading(true)
      setError('')

      try {
        const [leaders, members, rovers] = await Promise.all([
          leaderService.getAll(),
          memberService.getAll(),
          roverService.getAll(),
        ])

        if (isMounted) {
          setStats({
            leaders: leaders.length,
            members: members.length,
            rovers: rovers.length,
          })
        }
      } catch {
        if (isMounted) {
          setError('تعذر تحميل بيانات لوحة التحكم. تأكد من صلاحيات فايرستور.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadStats()

    return () => {
      isMounted = false
    }
  }, [])

  const totalRecords = stats.leaders + stats.members + stats.rovers
  const cards = [
    {
      title: 'القادة',
      count: stats.leaders,
      description: 'سجلات القادة والخدام والبيانات التفصيلية الخاصة بهم.',
      link: '/leaders',
    },
    {
      title: 'الأعضاء',
      count: stats.members,
      description: 'بيانات الأعضاء والمراحل والعناوين والهواتف والصور.',
      link: '/members',
    },
    {
      title: 'القادة البنات',
      count: stats.rovers,
      description: 'إدارة ملفات القادة البنات بنفس حقول القادة بالكامل.',
      link: '/rovers',
    },
  ]

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div className="dashboard-page__hero-copy">
          <p className="dashboard-page__eyebrow">نظرة عامة</p>
          <h2 className="dashboard-page__headline">
            بيانات كشافه كنيسه الانبا كاراس و الانبا ابرام
          </h2>
          <p className="dashboard-page__lead">
            يمكنك متابعة أعداد القادة والأعضاء والقادة البنات والانتقال مباشرة إلى كل
            قسم لإضافة البيانات أو تعديلها أو حذفها أو البحث فيها.
          </p>
        </div>

        <div className="dashboard-page__total-card">
          <span>إجمالي السجلات</span>
          <strong>{isLoading ? '...' : formatNumber(totalRecords)}</strong>
          <p>في جميع الأقسام النشطة</p>
        </div>
      </div>

      {error ? <p className="dashboard-page__error">{error}</p> : null}

      <div className="dashboard-page__stats">
        {cards.map((card) => (
          <Link className="dashboard-card" key={card.link} to={card.link}>
            <p className="dashboard-card__title">{card.title}</p>
            <strong className="dashboard-card__count">
              {isLoading ? '...' : formatNumber(card.count)}
            </strong>
            <p className="dashboard-card__copy">{card.description}</p>
            <span className="dashboard-card__action">فتح القسم</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default Dashboard
