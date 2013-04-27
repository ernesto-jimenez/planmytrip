require 'rubygems'
require 'sinatra'
require 'haml'
require 'json'

# Helpers
require './lib/render_partial'

# Set Sinatra variables
set :app_file, __FILE__
set :root, File.dirname(__FILE__)
set :views, 'views'
set :public_folder, 'public'
set :haml, {:format => :html5} # default Haml format is :xhtml

# Application routes
get '/' do
  File.read(File.join('public', 'index.html'))
end

post '/trip' do
  redirect to('/trip/whatever/edit')
end

get '/trip/:id/edit' do
  haml :index, :layout => :'layouts/application'
end

get '/trip/:id/suggestions' do
  [
    place('Times Square', [], 'bla bla bla'),
    place('Times Square', [], 'bla bla bla'),
    place('Times Square', [], 'bla bla bla'),
    place('Times Square', [], 'bla bla bla'),
    place('Times Square', [], 'bla bla bla')
  ].to_json
end

class Trip
  attr_reader :city, :coords

  def initialize(city, coords)
    self.city = city
    self.coords = coords
  end

  def find(id)
    return Trip.new('London', '51.506321,-0.127140')
  end

  def places
  end
end

def place(name, photos, desc)
  {
    name: name,
    id: '1234',
    photos: photos,
    desc: desc
  }
end

