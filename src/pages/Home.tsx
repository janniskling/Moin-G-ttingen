import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { WeatherWidget } from '../components/WeatherWidget';
import { Calendar, Percent, Trophy, ArrowRight, MessageCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <section className="space-y-4 pt-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          Moin <span className="text-primary">Göttingen</span>
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Dein Begleiter für den Studienalltag. Deals, Events und die besten Orte der Stadt.
        </p>
      </section>

      <section className="grid gap-4">
        <Link to="/events">
          <Card className="group hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Was geht ab?</h3>
                  <p className="text-sm text-muted-foreground">Finde Events in deiner Nähe.</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/chats">
          <Card className="group hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Community</h3>
                  <p className="text-sm text-muted-foreground">Chatte mit anderen Studis.</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/ranking">
          <Card className="group hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Ranking</h3>
                  <p className="text-sm text-muted-foreground">Die beliebtesten Orte.</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/deals">
          <Card className="group hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                  <Percent className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    Deals
                    <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                      Beta
                    </span>
                  </h3>
                  <p className="text-sm text-muted-foreground">Die besten Angebote der Stadt.</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>
      </section>

      <section>
        <WeatherWidget />
      </section>
    </div>
  );
}
